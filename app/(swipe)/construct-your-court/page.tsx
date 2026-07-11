import ConstructClient from '@/components/pages/ConstructClient';
import { getPageContent } from '@/lib/content/get';

export const metadata = {
  title: 'Construct Your Court — Court Hub',
  description:
    'Engineer your bespoke padel arena. From soil engineering to certified 12mm safety glass and Mondo turf — turnkey GCC court construction by Court Hub.',
};

export const revalidate = 300;

export default async function Page() {
  const content = await getPageContent('construct');
  return <ConstructClient content={content} />;
}
