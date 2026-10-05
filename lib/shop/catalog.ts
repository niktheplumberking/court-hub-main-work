import { supabasePublic } from '@/lib/supabase/public';
import type { Product } from '@/lib/types';

/**
 * The storefront's view of a product — built ONLY from the products table, so
 * what customers see is exactly what the admin entered and exactly what
 * checkout will charge (checkout re-reads price and stock server-side by `id`).
 *
 * `id` is the database uuid (what the cart and checkout use); `slug` is the
 * URL segment. Nothing here is invented: badges, discounts and stock all come
 * from real fields.
 */
export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  /** Real "was" price — only set when the admin entered one higher than price. */
  compareAt: number | null;
  image: string;
  images: string[];
  desc: string;
  categorySlug: string | null;
  categoryName: string | null;
  condition: 'new' | 'like-new' | 'good' | 'fair' | null;
  specs: Record<string, string>;
  inStock: boolean;
  /** Most a buyer can put in the cart: 1 for unique items, else stock on hand. */
  maxQty: number;
};

export type ShopCategory = { slug: string; name: string };

const FALLBACK_IMAGE = '/placeholders/racket-01.jpeg';

function toShopProduct(p: Product): ShopProduct {
  const images = (p.images ?? []).filter(Boolean);
  const maxQty = p.is_unique ? Math.min(1, p.quantity) : Math.max(0, p.quantity);
  const compareAt =
    p.compare_at_price != null && Number(p.compare_at_price) > Number(p.price_aed)
      ? Number(p.compare_at_price)
      : null;
  return {
    id: p.id,
    slug: p.slug,
    name: p.title,
    brand: (p.brand ?? '').trim(),
    price: Number(p.price_aed),
    compareAt,
    image: images[0] ?? FALLBACK_IMAGE,
    images: images.length ? images : [FALLBACK_IMAGE],
    desc: (p.description ?? '').trim(),
    categorySlug: p.categories?.slug ?? null,
    categoryName: p.categories?.name ?? null,
    condition: p.condition ?? null,
    specs: p.specs ?? {},
    inStock: maxQty > 0,
    maxQty,
  };
}

/** Every active product, newest first. Empty array on any failure (page shows its empty state). */
export async function getShopProducts(): Promise<ShopProduct[]> {
  try {
    const { data, error } = await supabasePublic()
      .from('products')
      .select('*, categories(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data as Product[] | null) ?? []).map(toShopProduct);
  } catch (e) {
    console.error('[shop] products fetch failed', e);
    return [];
  }
}

/** One active product by URL slug, or null (unknown, draft, sold or archived). */
export async function getShopProduct(slug: string): Promise<ShopProduct | null> {
  try {
    const { data, error } = await supabasePublic()
      .from('products')
      .select('*, categories(*)')
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle();
    if (error) throw error;
    return data ? toShopProduct(data as Product) : null;
  } catch (e) {
    console.error('[shop] product fetch failed', e);
    return null;
  }
}

/** Categories that actually contain at least one of the given products, in admin sort order. */
export async function getShopCategories(products: ShopProduct[]): Promise<ShopCategory[]> {
  const used = new Set(products.map((p) => p.categorySlug).filter(Boolean));
  try {
    const { data, error } = await supabasePublic()
      .from('categories')
      .select('slug, name, sort')
      .order('sort', { ascending: true });
    if (error) throw error;
    return (data ?? [])
      .filter((c) => used.has(c.slug))
      .map((c) => ({ slug: c.slug as string, name: c.name as string }));
  } catch (e) {
    console.error('[shop] categories fetch failed', e);
    return [];
  }
}
