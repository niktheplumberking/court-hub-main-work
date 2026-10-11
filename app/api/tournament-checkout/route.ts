import { NextResponse } from 'next/server';
import { AED, getStripe, toFils } from '@/lib/stripe';
import { getTournament } from '@/lib/tournaments/server-store';
import { tournamentsArePublic } from '@/lib/tournaments/flags';
import { rateLimit, clientIp } from '@/lib/rate-limit';

/**
 * Creates a Stripe Checkout session for a tournament entry fee. Dormant until
 * real Stripe keys are configured (getStripe() returns null on placeholders);
 * the booking flow then uses the recorded demo payment instead.
 *
 * The fee always comes from the server store, never from the client. Team data
 * rides in per-field session metadata (500-char limit per value) and is
 * recorded on the success return; at the final stage (Supabase) recording
 * moves into the webhook for durability.
 */
export async function POST(req: Request) {
  // Section hidden → its payment endpoint is closed too (hiding pages does not
  // protect an API route, which anyone can call directly).
  if (!tournamentsArePublic()) return NextResponse.json({ error: 'Registration is not open yet.' }, { status: 404 });
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Payments are not configured yet.' }, { status: 503 });
  if (!rateLimit(`tcheckout:${clientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes.' }, { status: 429 });
  }

  let body: { slug?: string; team?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const slug = typeof body.slug === 'string' ? body.slug.slice(0, 120) : '';
  const team: Record<string, string> = body.team && typeof body.team === 'object' ? body.team : {};
  const str = (v: unknown) => (typeof v === 'string' ? v : '').trim();
  const captain = str(team.captain).slice(0, 120);
  const email = str(team.email).slice(0, 254);
  const partner = str(team.partner).slice(0, 120);
  if (!captain || !email || !partner) {
    return NextResponse.json({ error: 'Please fill the required fields.' }, { status: 400 });
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
  }

  const t = await getTournament(slug);
  if (!t) return NextResponse.json({ error: 'This tournament no longer exists.' }, { status: 404 });
  if (t.status !== 'open') return NextResponse.json({ error: 'Registration for this event is closed.' }, { status: 409 });
  if (t.reg >= t.cap) return NextResponse.json({ error: 'This event is full.' }, { status: 409 });

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005';
  const meta = (v: unknown) => str(v).slice(0, 450);

  let session;
  try {
  session = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: AED,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: AED,
          unit_amount: toFils(t.fee),
          product_data: { name: `${t.name} · Tournament Entry (1 pair)` },
        },
      },
    ],
    customer_email: email,
    success_url: `${site}/tournaments/${t.slug}/register?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/tournaments/${t.slug}/register`,
    metadata: {
      type: 'tournament_registration',
      slug: t.slug,
      captain: meta(captain),
      email: meta(email),
      phone: meta(team.phone),
      nat: meta(team.nat),
      level: meta(team.level),
      partner: meta(partner),
      pcontact: meta(team.pcontact),
    },
  });
  } catch (e) {
    console.error('[tournament-checkout] stripe session create failed', e);
    return NextResponse.json({ error: 'Payment could not be started. Please try again.' }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
