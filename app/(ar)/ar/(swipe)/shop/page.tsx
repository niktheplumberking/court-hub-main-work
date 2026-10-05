import ShopClient from '@/components/pages/ShopClient';
import { getPageContent } from '@/lib/content/get';
import { getShopCategories, getShopProducts } from '@/lib/shop/catalog';

export const revalidate = 300;

export const metadata = {
  title: 'المتجر — Court Hub',
  description:
    'مضارب بادل فاخرة ومستعملة معتمدة ومعدات وإكسسوارات، منتقاة من Court Hub في الإمارات. دفع آمن بالدرهم.',
  alternates: { canonical: '/ar/shop', languages: { en: '/shop', ar: '/ar/shop', 'x-default': '/shop' } },
};

export default async function Page() {
  const [content, products] = await Promise.all([getPageContent('shop', 'ar'), getShopProducts()]);
  const categories = await getShopCategories(products);
  return <ShopClient content={content} products={products} categories={categories} />;
}
