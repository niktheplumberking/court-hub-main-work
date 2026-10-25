import { notFound } from 'next/navigation';
import ProductClient from './ProductClient';
import JsonLd from '@/components/shared/JsonLd';
import { getShopProduct, getShopProducts } from '@/lib/shop/catalog';
import { productSchema } from '@/lib/seo';
import type { Locale } from '@/lib/i18n/locale';

export default async function ProductPage({ params, locale }: { params: Promise<{ slug: string }>; locale: Locale }) {
  const { slug } = await params;
  const product = await getShopProduct(slug);
  if (!product) notFound();
  const related = (await getShopProducts()).filter((p) => p.id !== product.id && p.inStock).slice(0, 4);
  return <><JsonLd data={productSchema(product, locale)} /><ProductClient product={product} related={related} /></>;
}
