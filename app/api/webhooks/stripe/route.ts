import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fulfillCheckoutSession, revalidateStorefront } from '@/lib/shop/fulfill';

/**
 * Stripe webhook.
 *  • checkout.session.completed / async_payment_succeeded → record the order,
 *    turn the stock reservation into a sale (unique items → 'sold').
 *  • checkout.session.expired → shopper never paid: give the stock back.
 *
 * All handlers are idempotent (Stripe retries and may deliver twice). Any
 * database failure answers 500 so Stripe retries instead of losing an order.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig ?? '', secret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const result = await fulfillCheckoutSession(event.data.object);
        if (result === 'ok' || result === 'late') revalidateStorefront();
        break;
      }
      case 'checkout.session.expired': {
        const holdId = event.data.object.metadata?.hold_id;
        if (holdId) {
          const { data: released, error } = await supabaseAdmin().rpc('release_hold', { p_hold: holdId });
          if (error) throw new Error(`release_hold failed: ${error.message}`);
          if (released) revalidateStorefront();
        }
        break;
      }
    }
  } catch (e) {
    console.error('[stripe webhook]', event.type, event.id, e);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
