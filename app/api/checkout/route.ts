import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getStripe, AED, toFils } from '@/lib/stripe';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { releaseHold, revalidateStorefront, sweepExpiredHolds, type HoldItem } from '@/lib/shop/fulfill';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LINES = 50;
// Stripe's shortest allowed checkout lifetime is 30 minutes; the DB hold
// (32 min) outlives it so stock is never returned while the page can still pay.
const SESSION_MINUTES = 31;

type ErrorCode =
  | 'not_configured'
  | 'rate_limited'
  | 'bad_request'
  | 'unavailable'
  | 'stock'
  | 'min_total'
  | 'stripe'
  | 'server';

// Every failure is JSON with a machine-readable `code` (the cart shows a
// localized message for it) plus an English `error` for logs/debugging.
const fail = (code: ErrorCode, error: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ code, error, ...extra }, { status });

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) return fail('not_configured', 'Payments are not configured.', 503);

  if (!rateLimit(`checkout:${clientIp(req)}`, 30, 10 * 60_000)) {
    return fail('rate_limited', 'Too many checkout attempts.', 429);
  }

  let body: { items?: unknown; locale?: unknown; replaceHold?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail('bad_request', 'Invalid request body.', 400);
  }

  // ── Validate + merge duplicate lines (same product twice = one line) ──
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_LINES) {
    return fail('bad_request', 'Cart is empty or invalid.', 400);
  }
  const merged = new Map<string, number>();
  for (const raw of body.items as { id?: unknown; qty?: unknown }[]) {
    const id = typeof raw?.id === 'string' ? raw.id : '';
    const qty = Number(raw?.qty);
    if (!UUID.test(id) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return fail('bad_request', 'Cart contains an invalid item.', 400);
    }
    merged.set(id, (merged.get(id) ?? 0) + qty);
  }
  const cart = [...merged].map(([id, qty]) => ({ id, qty }));
  const prefix = body.locale === 'ar' ? '/ar' : '';

  // A shopper who went back from Stripe and pressed checkout again: free the
  // stock their previous, abandoned session was holding before reserving anew.
  if (typeof body.replaceHold === 'string' && UUID.test(body.replaceHold)) {
    await releaseHold(body.replaceHold);
  }
  void sweepExpiredHolds();

  // ── Reserve stock atomically (all-or-nothing) ──
  // One retry on a network blip (connection reset / timeout before Postgres
  // answered). Worst case the first attempt did commit: that extra hold has
  // no Stripe session and is freed by the sweeper when it expires — stock is
  // briefly held, never oversold.
  const db = supabaseAdmin();
  const reserve = () => db.rpc('reserve_stock', { p_items: cart, p_minutes: SESSION_MINUTES + 1 });
  let { data: reservation, error: reserveError } = await reserve();
  if (reserveError && !reserveError.code && /fetch failed|socket hang up|ECONNRESET|ETIMEDOUT|network/i.test(reserveError.message)) {
    await new Promise((res) => setTimeout(res, 200));
    ({ data: reservation, error: reserveError } = await reserve());
  }
  if (reserveError || !reservation) {
    console.error('[checkout] reserve_stock failed', reserveError);
    return fail('server', 'Could not check stock. Please try again.', 500);
  }
  const r = reservation as {
    ok: boolean;
    hold_id: string;
    items: HoldItem[];
    zeroed: boolean;
    reason?: 'unavailable' | 'stock' | 'empty';
    id?: string;
    available?: number;
  };
  if (!r.ok) {
    if (r.reason === 'empty') return fail('bad_request', 'Cart is empty.', 400);
    const code = r.reason === 'stock' ? 'stock' : 'unavailable';
    return fail(code, code === 'stock' ? 'Not enough stock.' : 'Item no longer available.', 409, {
      id: r.id,
      available: r.available ?? 0,
    });
  }

  const giveBack = async () => {
    const { error } = await db.rpc('release_hold', { p_hold: r.hold_id });
    if (error) console.error('[checkout] release after failure failed', r.hold_id, error);
  };

  const total = r.items.reduce((sum, i) => sum + toFils(Number(i.price_aed)) * i.qty, 0);
  if (total < 200) {
    await giveBack();
    return fail('min_total', 'The order total must be at least AED 2.', 400);
  }

  const { data: imgs } = await db.from('products').select('id, images').in('id', r.items.map((i) => i.id));
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005';

  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        currency: AED,
        line_items: r.items.map((i) => ({
          quantity: i.qty,
          price_data: {
            currency: AED,
            unit_amount: toFils(Number(i.price_aed)),
            product_data: {
              name: i.title,
              images: (imgs?.find((p) => p.id === i.id)?.images as string[] | undefined)?.slice(0, 1) ?? [],
            },
          },
        })),
        success_url: `${site}/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${site}${prefix}/shop?checkout=cancelled`,
        expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
        shipping_address_collection: { allowed_countries: ['AE'] },
        phone_number_collection: { enabled: true },
        client_reference_id: r.hold_id,
        metadata: { hold_id: r.hold_id },
        payment_intent_data: { metadata: { hold_id: r.hold_id } },
      },
      // A network retry can never open two sessions for one reservation.
      { idempotencyKey: `checkout-${r.hold_id}` }
    );
  } catch (e) {
    console.error('[checkout] stripe session create failed', e);
    await giveBack();
    return fail('stripe', 'Payment could not be started.', 502);
  }

  const { error: linkError } = await db
    .from('checkout_holds')
    .update({ stripe_session_id: session.id })
    .eq('id', r.hold_id);
  if (linkError) console.error('[checkout] could not link hold to session', r.hold_id, linkError);

  // Something just hit zero stock: refresh the storefront so it shows sold out.
  if (r.zeroed) revalidateStorefront();

  return NextResponse.json({ url: session.url, hold: r.hold_id });
}
