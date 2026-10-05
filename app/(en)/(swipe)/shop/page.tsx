import ShopClient from '@/components/pages/ShopClient';
import { getPageContent } from '@/lib/content/get';
import { getShopCategories, getShopProducts } from '@/lib/shop/catalog';

export const revalidate = 300;

export const metadata = {
  alternates: { canonical: '/shop', languages: { en: '/shop', ar: '/ar/shop', 'x-default': '/shop' } },
  title: 'Shop — Court Hub',
  description:
    'Premium and certified pre-owned padel rackets, gear and accessories — curated by Court Hub in the UAE. Secure checkout in AED.',
};

export default async function Page() {
  const [content, products] = await Promise.all([getPageContent('shop'), getShopProducts()]);
  const categories = await getShopCategories(products);
  return <ShopClient content={content} products={products} categories={categories} />;
}
