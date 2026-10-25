import ProductPage from '@/components/pages/ProductPage';
import { getShopProduct } from '@/lib/shop/catalog';
import { productMetadata } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getShopProduct(slug);
  return product ? productMetadata(product, 'en') : { title: 'Product | Court Hub', robots: { index: false, follow: true } };
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ProductPage params={params} locale="en" />;
}
