import type Stripe from 'stripe';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

/**
 * Order lifecycle (see supabase/UPGRADE-CHECKOUT.sql):
 *
 *   checkout starts  → reserve_stock()  stock taken, hold 'held'
 *   payment succeeds → fulfill…()       order row + convert_hold() → 'converted'
 *   abandoned        → release_hold()   stock returned, hold 'released'
 *
 * Every step is idempotent, so the Stripe webhook, its retries and the
 * success page can all run it, in any order, at the same time, safely.
 */

export type HoldItem = { id: string; title: string; qty: number; price_aed: number };

export function revalidateStorefront() {
  for (const path of ['/', '/ar', '/shop', '/ar/shop']) revalidatePath(path);
  revalidatePath('/shop/[slug]', 'page');
  revalidatePath('/ar/shop/[slug]', 'page');
}

const isPaid = (s: Stripe.Checkout.Session) =>
  s.status === 'complete' && (s.payment_status === 'paid' || s.payment_status === 'no_payment_required');

/**
 * Records a paid checkout as an order and finalises its stock.
 * Returns 'unpaid' when the session is not paid (nothing is written).
 * Throws on database failure so the webhook answers 500 and Stripe retries.
 */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<'unpaid' | 'skipped' | 'ok' | 'late'> {
  if (session.metadata?.type === 'tournament_registration') return 'skipped';
  if (!isPaid(session)) return 'unpaid';

  const db = supabaseAdmin();
  const holdId = session.metadata?.hold_id || null;

  let items: HoldItem[];
  if (holdId) {
    const { data: hold, error } = await db.from('checkout_holds').select('items').eq('id', holdId).maybeSingle();
    if (error) throw new Error(`hold lookup failed: ${error.message}`);
    items = (hold?.items as HoldItem[] | undefined) ?? [];
  } else {
    // Checkout started before the reservation upgrade: rebuild items from the cart metadata.
    const cart: { id: string; qty: number }[] = JSON.parse(session.metadata?.cart ?? '[]');
    const { data: products } = await db
      .from('products')
      .select('id, title, price_aed')
      .in('id', cart.map((c) => c.id));
    items = cart.map((c) => {
      const p = products?.find((x) => x.id === c.id);
      return { id: c.id, title: p?.title ?? 'Unknown item', qty: c.qty, price_aed: Number(p?.price_aed ?? 0) };
    });
  }

  // Defence in depth: the charge must match what was reserved, in AED. Our
  // server builds every session from DB prices, so a mismatch means something
  // is badly wrong — the customer DID pay, so the order is still recorded, but
  // it is logged loudly and flagged in the admin (items ≠ charged).
  const expected = items.reduce((s, i) => s + Math.round(Number(i.price_aed) * 100) * i.qty, 0);
  if (session.currency !== 'aed' || (holdId && session.amount_total !== expected)) {
    console.error('[fulfill] AMOUNT/CURRENCY MISMATCH — review this order', {
      session: session.id,
      currency: session.currency,
      charged: session.amount_total,
      expected,
    });
  }

  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;

  // ON CONFLICT DO NOTHING on the unique stripe_session_id: concurrent webhook
  // deliveries and the success page can never create two orders.
  const { data: inserted, error: insertError } = await db
    .from('orders')
    .upsert(
      {
        stripe_session_id: session.id,
        hold_id: holdId,
        stripe_payment_intent: pi,
        customer_email: session.customer_details?.email ?? null,
        customer_name: session.customer_details?.name ?? null,
        customer_phone: session.customer_details?.phone ?? null,
        shipping: (session.collected_information?.shipping_details as object | undefined) ?? null,
        items,
        amount_aed: (session.amount_total ?? 0) / 100,
        status: 'paid',
      },
      { onConflict: 'stripe_session_id', ignoreDuplicates: true }
    )
    .select('id');
  if (insertError) throw new Error(`order insert failed: ${insertError.message}`);

  let result: 'ok' | 'late' = 'ok';
  if (holdId) {
    const { data: conv, error } = await db.rpc('convert_hold', { p_hold: holdId });
    if (error) throw new Error(`convert_hold failed: ${error.message}`);
    if (conv === 'late') {
      result = 'late';
      console.error('[fulfill] payment arrived after its reservation was released — check stock', session.id);
    }
  } else if (inserted && inserted.length > 0) {
    // Legacy path: only the call that actually created the order takes stock.
    const { error } = await db.rpc('take_stock', { p_items: items });
    if (error) console.error('[fulfill] legacy take_stock failed', session.id, error);
  }
  return result;
}

/**
 * Gives a reservation's stock back. If the Stripe session is still open it is
 * expired first, so the customer can't pay on a page whose stock was returned.
 * A session that turns out to be paid is fulfilled instead of released.
 */
export async function releaseHold(holdId: string): Promise<boolean> {
  const db = supabaseAdmin();
  const { data: hold } = await db
    .from('checkout_holds')
    .select('id, status, stripe_session_id')
    .eq('id', holdId)
    .maybeSingle();
  if (!hold || hold.status !== 'held') return false;

  const stripe = getStripe();
  if (hold.stripe_session_id && stripe) {
    try {
      const s = await stripe.checkout.sessions.retrieve(hold.stripe_session_id);
      if (s.status === 'complete') {
        await fulfillCheckoutSession(s);
        return false;
      }
      if (s.status === 'open') await stripe.checkout.sessions.expire(s.id);
    } catch (e) {
      // Could not confirm with Stripe: keep the hold; the sweeper retries later.
      console.error('[release] stripe check failed', holdId, e);
      return false;
    }
  }
  const { data: released, error } = await db.rpc('release_hold', { p_hold: holdId });
  if (error) {
    console.error('[release] release_hold failed', holdId, error);
    return false;
  }
  if (released) revalidateStorefront();
  return Boolean(released);
}

let sweeping = false;
let lastSweep = 0;

/**
 * Safety net for reservations whose Stripe "expired" event never arrived
 * (webhook event not enabled, server restart, outage). Cheap: one indexed
 * query, at most once a minute, a handful of rows per run.
 */
export async function sweepExpiredHolds(): Promise<void> {
  if (sweeping || Date.now() - lastSweep < 60_000) return;
  sweeping = true;
  lastSweep = Date.now();
  try {
    const { data } = await supabaseAdmin()
      .from('checkout_holds')
      .select('id')
      .eq('status', 'held')
      .lt('expires_at', new Date().toISOString())
      .limit(20);
    for (const h of data ?? []) await releaseHold(h.id);
  } catch (e) {
    console.error('[sweep] failed', e);
  } finally {
    sweeping = false;
  }
}
