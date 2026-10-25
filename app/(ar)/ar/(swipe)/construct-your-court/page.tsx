import { pageMetadata } from '@/lib/seo';
import ConstructClient from '@/components/pages/ConstructClient';
import { getPageContent } from '@/lib/content/get';

export const revalidate = 300;

export const metadata = pageMetadata("/construct-your-court", "ar", {
  "title": "إنشاء ملاعب البادل في دبي والإمارات | Court Hub",
  "description": "ناقش مشروع إنشاء ملعب البادل مع Court Hub. أرسل اسمك وبيانات التواصل وموقع الملعب، ثم تحدث مع فريقنا عبر واتساب."
});

export default async function Page() {
  const content = await getPageContent('construct', 'ar');
  return <ConstructClient content={content} />;
}
