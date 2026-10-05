import AboutClient from '@/components/pages/AboutClient';
import { getPageContent } from '@/lib/content/get';
import { getShopProducts } from '@/lib/shop/catalog';

export const revalidate = 300;

export const metadata = {
  title: 'About — Court Hub',
  description:
    'Court Hub engineers world-class padel arenas in Al Quoz, Dubai — fusing aerospace metallurgy with sport science for structurally silent, climate-resilient courts across the GCC.',
};

export default async function Page() {
  const [content, products] = await Promise.all([getPageContent('about'), getShopProducts()]);
  return <AboutClient content={content} products={products} />;
}
