import { pageMetadata } from '@/lib/seo';
import AboutClient from '@/components/pages/AboutClient';
import { getPageContent } from '@/lib/content/get';
import { getShopProducts } from '@/lib/shop/catalog';

export const revalidate = 300;

export const metadata = pageMetadata("/about", "ar", {
  "title": "عن Court Hub | معدات وملاعب البادل في دبي",
  "description": "تعرف على Court Hub في دبي والإمارات. استكشف متجر معدات البادل وتواصل مع فريقنا لمناقشة إنشاء ملعبك."
});

export default async function Page() {
  const [content, products] = await Promise.all([getPageContent('about', 'ar'), getShopProducts()]);
  return <AboutClient content={content} products={products} />;
}
