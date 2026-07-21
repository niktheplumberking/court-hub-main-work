import ShopClient from '@/components/pages/ShopClient';
import { getPageContent } from '@/lib/content/get';

export const revalidate = 300;

export const metadata = {
  title: 'Shop — Court Hub',
  description:
    'Premium and certified pre-owned padel rackets, gear and accessories — curated by Court Hub in the UAE. Secure checkout in AED.',
};

export default async function Page() {
  const content = await getPageContent('shop');
  return <ShopClient content={content} />;
}
