import { pageMetadata } from '@/lib/seo';
import ShopClient from '@/components/pages/ShopClient';
import { getPageContent } from '@/lib/content/get';
import { getShopCategories, getShopProducts } from '@/lib/shop/catalog';

export const revalidate = 300;

export const metadata = pageMetadata("/shop", "ar", {
  "title": "متجر مضارب ومعدات البادل في الإمارات | Court Hub",
  "description": "تسوق مضارب ومعدات البادل لدى Court Hub. قارن الأسعار بالدرهم الإماراتي وحالة كل منتج ومدى توفره في متجرنا الإلكتروني."
});

export default async function Page() {
  const [content, products] = await Promise.all([getPageContent('shop', 'ar'), getShopProducts()]);
  const categories = await getShopCategories(products);
  return <ShopClient content={content} products={products} categories={categories} />;
}
