import { getHeroRackets } from '@/lib/shop/catalog';
import { cleanProductCopy } from '@/lib/copy';
import JsonLd from '@/components/shared/JsonLd';
import { homeSchema } from '@/lib/seo';
import { pageMetadata } from '@/lib/seo';
import SimplifiedHome from '@/components/home/simplified/SimplifiedHome';
import { supabasePublic } from '@/lib/supabase/public';
import { getPageContent } from '@/lib/content/get';
import type { Product } from '@/lib/types';

export const revalidate = 60;

export const metadata = pageMetadata("/", "en", {
  "title": "Court Hub | Padel Rackets & Court Construction in Dubai, UAE",
  "description": "Discover padel rackets and equipment at Court Hub in Dubai, UAE. Shop in AED, compare product conditions and discuss your court construction project on WhatsApp."
});

/**
 * Fetches the eight newest active products for the homepage top-sellers rail.
 * Uses the cookie-less supabasePublic() client so the route stays static
 * and `revalidate = 60` (ISR) actually applies — supabaseServer()'s
 * `await cookies()` would force the page fully dynamic. Wrapped in
 * try/catch so a missing DB (local dev without Supabase env) degrades to
 * the rail's placeholder-catalog fallback instead of crashing the homepage.
 */
async function getTopSellerProducts(): Promise<Product[]> {
  try {
    const supabase = supabasePublic();
    const { data } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8);
    return ((data as Product[] | null) ?? []).map(cleanProductCopy);
  } catch (e) {
    console.error('[home] top sellers fetch failed', e);
    return [];
  }
}

export default async function HomePage() {
  const [products, content, heroRackets] = await Promise.all([
    getTopSellerProducts(),
    getPageContent('home'),
    getHeroRackets(),
  ]);
  return <><JsonLd data={homeSchema('en')} /><SimplifiedHome products={products} content={content} heroRackets={heroRackets} /></>;
}
