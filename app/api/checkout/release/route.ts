import { NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { releaseHold } from '@/lib/shop/fulfill';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Called by the cart when a shopper comes back from Stripe without paying
 * (Cancel link or browser Back). Returns the reserved stock immediately
 * instead of waiting ~30 minutes for the Stripe session to expire.
 * The hold id is an unguessable uuid only that shopper's browser knows.
 */
export async function POST(req: Request) {
  if (!rateLimit(`release:${clientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ released: false }, { status: 429 });
  }
  let hold: unknown;
  try {
    ({ hold } = await req.json());
  } catch {
    return NextResponse.json({ released: false }, { status: 400 });
  }
  if (typeof hold !== 'string' || !UUID.test(hold)) {
    return NextResponse.json({ released: false }, { status: 400 });
  }
  const released = await releaseHold(hold);
  return NextResponse.json({ released });
}
