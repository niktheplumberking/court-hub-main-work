import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

/**
 * Stripe webhook: checkout.session.completed
 * 1. Creates the order record
 * 2. Decrements stock for each purchased item
 * 3. Unique items (used rackets etc.) auto-flip to 'sold' → vanish from the shop
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, secret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Tournament entries are NOT shop orders. They are recorded on the booking
    // success-return page for now (in-memory stage); when the tournaments
    // Supabase project lands, durable recording moves here. Without this guard
    // the fallthrough below would insert an empty order for every entry fee.
    if (session.metadata?.type === 'tournament_registration') {
      return NextResponse.json({ received: true });
    }

    const supabase = supabaseAdmin();

    // Idempotency: skip if this session was already processed
    const { data: existing } = await supabase
      .from('orders').select('id').eq('stripe_session_id', session.id).maybeSingle();
    if (existing) return NextResponse.json({ received: true });

    const cart: { id: string; qty: number }[] = JSON.parse(session.metadata?.cart ?? '[]');
    const ids = cart.map((c) => c.id);
    const { data: products } = await supabase.from('products').select('*').in('id', ids);

    const orderItems = cart.map((c) => {
      const p = products?.find((x) => x.id === c.id);
      return { id: c.id, title: p?.title ?? 'Unknown', qty: c.qty, price_aed: p?.price_aed ?? 0 };
    });

    await supabase.from('orders').insert({
      stripe_session_id: session.id,
      customer_email: session.customer_details?.email ?? null,
      customer_name: session.customer_details?.name ?? null,
      customer_phone: session.customer_details?.phone ?? null,
      shipping: (session.collected_information?.shipping_details as object) ?? null,
      items: orderItems,
      amount_aed: (session.amount_total ?? 0) / 100,
      status: 'paid',
    });

    // Inventory: decrement + auto-sold for unique items
    for (const c of cart) {
      const p = products?.find((x) => x.id === c.id);
      if (!p) continue;
      const newQty = Math.max(0, p.quantity - c.qty);
      const newStatus = newQty <= 0 && p.is_unique ? 'sold' : p.status;
      await supabase.from('products')
        .update({ quantity: newQty, status: newStatus })
        .eq('id', c.id);
    }
  }

  return NextResponse.json({ received: true });
}
