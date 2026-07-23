import AboutClient from '@/components/pages/AboutClient';
import { getPageContent } from '@/lib/content/get';

export const revalidate = 300;

export const metadata = {
  title: 'About — Court Hub',
  description:
    'Court Hub engineers world-class padel arenas in Al Quoz, Dubai — fusing aerospace metallurgy with sport science for structurally silent, climate-resilient courts across the GCC.',
};

export default async function Page() {
  const content = await getPageContent('about');
  return <AboutClient content={content} />;
}
