import ShopClient from '@/components/pages/ShopClient';
import { getPageContent } from '@/lib/content/get';

export const revalidate = 300;

export const metadata = {
  title: 'المتجر — Court Hub',
  description:
    'مضارب بادل فاخرة ومستعملة معتمدة ومعدات وإكسسوارات، منتقاة من Court Hub في الإمارات. دفع آمن بالدرهم.',
  alternates: { canonical: '/ar/shop', languages: { en: '/shop', ar: '/ar/shop', 'x-default': '/shop' } },
};

export default async function Page() {
  const content = await getPageContent('shop', 'ar');
  return <ShopClient content={content} />;
}
