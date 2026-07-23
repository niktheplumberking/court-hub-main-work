import SimplifiedHome from '@/components/home/simplified/SimplifiedHome';
import { supabasePublic } from '@/lib/supabase/public';
import { getPageContent } from '@/lib/content/get';
import type { Product } from '@/lib/types';

export const revalidate = 60;

export const metadata = {
  title: 'Court Hub — متجر البادل الفاخر وإنشاء الملاعب في الإمارات',
  description:
    'ملاعب بادل فاخرة مُهندَسة لدول الخليج، مع متجر منتقى بعناية لأفضل المضارب والمعدات، كل ذلك في مكان واحد.',
  alternates: { canonical: '/ar', languages: { en: '/', ar: '/ar', 'x-default': '/' } },
};

async function getTopSellerProducts(): Promise<Product[]> {
  try {
    const supabase = supabasePublic();
    const { data } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8);
    return (data as Product[] | null) ?? [];
  } catch (e) {
    console.error('[home:ar] top sellers fetch failed', e);
    return [];
  }
}

export default async function ArabicHomePage() {
  const [products, content] = await Promise.all([
    getTopSellerProducts(),
    getPageContent('home', 'ar'),
  ]);
  return <SimplifiedHome products={products} content={content} locale="ar" />;
}
