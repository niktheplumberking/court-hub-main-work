import { pageMetadata } from '@/lib/seo';
import ShopClient from '@/components/pages/ShopClient';
import { getPageContent } from '@/lib/content/get';
import { getShopCategories, getShopProducts } from '@/lib/shop/catalog';

export const revalidate = 300;

export const metadata = pageMetadata("/shop", "en", {
  "title": "Padel Rackets & Equipment in Dubai, UAE | Court Hub",
  "description": "Shop padel rackets and equipment at Court Hub. Compare prices in AED, product conditions and current availability in our UAE online store."
});

export default async function Page() {
  const [content, products] = await Promise.all([getPageContent('shop'), getShopProducts()]);
  const categories = await getShopCategories(products);
  return <ShopClient content={content} products={products} categories={categories} />;
}
