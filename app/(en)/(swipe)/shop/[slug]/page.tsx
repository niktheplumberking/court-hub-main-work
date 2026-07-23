import { PRODUCTS } from '@/components/shop/placeholder-products';
import ProductClient from '@/components/pages/ProductClient';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PRODUCTS.find(x => x.id === slug);
  return { title: (p?.name ?? 'Product') + ' — Court Hub' };
}

export default function Page() {
  return <ProductClient />;
}
