import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getStripe, AED, toFils } from '@/lib/stripe';

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payments are not configured yet. Add STRIPE_SECRET_KEY to enable checkout.' },
      { status: 503 }
    );
  }

  const { items } = (await req.json()) as { items: { id: string; qty: number }[] };
  if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

  const supabase = supabaseAdmin();
  const ids = items.map((i) => i.id);
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .in('id', ids)
    .eq('status', 'active');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Server-side validation: price + stock come from the DB, never the client.
  const line_items = [];
  for (const item of items) {
    const p = products?.find((x) => x.id === item.id);
    if (!p) return NextResponse.json({ error: 'An item in your cart is no longer available.' }, { status: 409 });
    const qty = Math.min(item.qty, p.is_unique ? 1 : p.quantity);
    if (qty < 1 || p.quantity < qty)
      return NextResponse.json({ error: `"${p.title}" just sold out.` }, { status: 409 });
    line_items.push({
      quantity: qty,
      price_data: {
        currency: AED,
        unit_amount: toFils(p.price_aed),
        product_data: { name: p.title, images: p.images?.slice(0, 1) ?? [] },
      },
    });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005';

  // Stripe refuses amounts under its AED minimum (AED 2) and can reject for other reasons
  // (account not activated, bad key). Never let that surface as an empty 500: return JSON
  // the cart drawer can show, and log the real reason for us.
  const total = line_items.reduce((sum, li) => sum + li.price_data.unit_amount * li.quantity, 0);
  if (total < 200) {
    return NextResponse.json({ error: 'The order total must be at least AED 2.' }, { status: 400 });
  }

  let session;
  try {
  session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    currency: AED,
    success_url: `${site}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/shop`,
    shipping_address_collection: { allowed_countries: ['AE'] },
    phone_number_collection: { enabled: true },
    metadata: { cart: JSON.stringify(items.map((i) => ({ id: i.id, qty: i.qty }))) },
  });
  } catch (e) {
    console.error('[checkout] stripe session create failed', e);
    return NextResponse.json({ error: 'Payment could not be started. Please try again or contact us on WhatsApp.' }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
