import { pageMetadata } from '@/lib/seo';
import AboutClient from '@/components/pages/AboutClient';
import { getPageContent } from '@/lib/content/get';
import { getShopProducts } from '@/lib/shop/catalog';

export const revalidate = 300;

export const metadata = pageMetadata("/about", "en", {
  "title": "About Court Hub | Padel Equipment & Courts in Dubai",
  "description": "Meet Court Hub in Dubai, UAE. Explore our padel equipment shop and learn how to contact our team about court construction."
});

export default async function Page() {
  const [content, products] = await Promise.all([getPageContent('about'), getShopProducts()]);
  return <AboutClient content={content} products={products} />;
}
