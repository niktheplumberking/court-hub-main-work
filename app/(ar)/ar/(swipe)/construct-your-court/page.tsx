import ConstructClient from '@/components/pages/ConstructClient';
import { getPageContent } from '@/lib/content/get';

export const revalidate = 300;

export const metadata = {
  title: 'أنشئ ملعبك — Court Hub',
  description:
    'هندسة ملعب البادل الخاص بك حسب الطلب. من هندسة التربة إلى زجاج الأمان المعتمد بسماكة 12 ملم وعشب Mondo، إنشاء متكامل بمعايير خليجية من Court Hub.',
  alternates: {
    canonical: '/ar/construct-your-court',
    languages: { en: '/construct-your-court', ar: '/ar/construct-your-court', 'x-default': '/construct-your-court' },
  },
};

export default async function Page() {
  const content = await getPageContent('construct', 'ar');
  return <ConstructClient content={content} />;
}
