import AboutClient from '@/components/pages/AboutClient';
import { getPageContent } from '@/lib/content/get';

export const revalidate = 300;

export const metadata = {
  title: 'من نحن — Court Hub',
  description:
    'تُهندس Court Hub ملاعب بادل عالمية المستوى في القوز بدبي، بدمج علم المعادن بمواصفات الطيران مع علوم الرياضة لملاعب صامتة إنشائيًا ومقاومة للمناخ في دول الخليج.',
  alternates: { canonical: '/ar/about', languages: { en: '/about', ar: '/ar/about', 'x-default': '/about' } },
};

export default async function Page() {
  const content = await getPageContent('about', 'ar');
  return <AboutClient content={content} />;
}
