import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase/public';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sweepExpiredHolds } from '@/lib/shop/fulfill';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = 'force-dynamic';

/**
 * Live stock + price check for the items in a shopper's bag. The bag lives in
 * localStorage and can be days old; the drawer calls this when it opens so the
 * shopper sees "sold out" / new prices BEFORE pressing pay, not as an error after.
 */
export async function POST(req: Request) {
  let ids: unknown;
  let hold: unknown;
  try {
    ({ ids, hold } = await req.json());
  } catch {
    return NextResponse.json({ items: [] }, { status: 400 });
  }
  if (!Array.isArray(ids)) return NextResponse.json({ items: [] }, { status: 400 });
  const clean = [...new Set(ids.filter((i): i is string => typeof i === 'string' && UUID.test(i)))].slice(0, 50);
  if (!clean.length) return NextResponse.json({ items: [] });

  void sweepExpiredHolds();

  // Public client = only ACTIVE products are visible; anything missing is unavailable.
  const { data, error } = await supabasePublic()
    .from('products')
    .select('id, title, slug, price_aed, quantity, is_unique, images')
    .in('id', clean);
  if (error) return NextResponse.json({ items: [] }, { status: 503 });

  // Stock this same shopper is still holding (an unpaid Stripe page in another
  // tab) counts as available to THEM: checkout swaps the old hold for a new one.
  const own = new Map<string, number>();
  if (typeof hold === 'string' && UUID.test(hold)) {
    const { data: h } = await supabaseAdmin().from('checkout_holds').select('status, items').eq('id', hold).maybeSingle();
    if (h?.status === 'held') for (const i of h.items as { id: string; qty: number }[]) own.set(i.id, i.qty);
  }

  const items = clean.map((id) => {
    const p = data?.find((x) => x.id === id);
    if (!p) return { id, maxQty: 0 };
    const qty = p.quantity + (own.get(id) ?? 0);
    const maxQty = p.is_unique ? Math.min(1, qty) : Math.max(0, qty);
    return {
      id,
      title: p.title as string,
      slug: p.slug as string,
      price_aed: Number(p.price_aed),
      image: ((p.images as string[] | null) ?? [])[0] ?? null,
      maxQty,
    };
  });
  return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
}
