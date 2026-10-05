import { notFound } from 'next/navigation';
import ProductClient from '@/components/pages/ProductClient';
import { getShopProduct, getShopProducts } from '@/lib/shop/catalog';

// Fresh within 5 minutes on its own; the admin save action and the Stripe
// webhook also revalidate this route the moment price or stock changes.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getShopProduct(slug);
  if (!p) return { title: 'Product — Court Hub' };
  return {
    title: `${p.name} — Court Hub`,
    description: p.desc ? p.desc.slice(0, 160) : undefined,
    openGraph: { images: [p.image] },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getShopProduct(slug);
  // Unknown, draft, sold or archived: a real 404 (not a soft "not found" page),
  // so search engines drop dead product URLs.
  if (!product) notFound();
  const related = (await getShopProducts())
    .filter((p) => p.id !== product.id && p.inStock)
    .slice(0, 4);
  return <ProductClient product={product} related={related} />;
}
