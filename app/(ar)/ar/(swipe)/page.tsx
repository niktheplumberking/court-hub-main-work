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

export const metadata = pageMetadata("/", "ar", {
  "title": "Court Hub | مضارب البادل وإنشاء الملاعب في دبي والإمارات",
  "description": "اكتشف مضارب ومعدات البادل لدى Court Hub في دبي والإمارات. تسوق بالدرهم، وقارن حالة المنتجات، وتواصل عبر واتساب لمناقشة مشروع إنشاء ملعبك."
});

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
    console.error('[home:ar] top sellers fetch failed', e);
    return [];
  }
}

export default async function ArabicHomePage() {
  const [products, content, heroRackets] = await Promise.all([
    getTopSellerProducts(),
    getPageContent('home', 'ar'),
    getHeroRackets(),
  ]);
  return <><JsonLd data={homeSchema('ar')} /><SimplifiedHome products={products} content={content} heroRackets={heroRackets} locale="ar" /></>;
}
