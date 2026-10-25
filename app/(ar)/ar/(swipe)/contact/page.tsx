import { pageMetadata } from '@/lib/seo';
import ContactClient from '@/components/pages/ContactClient';
import { getPageContent } from '@/lib/content/get';

export const revalidate = 300;

export const metadata = pageMetadata("/contact", "ar", {
  "title": "تواصل مع Court Hub | واتساب وعنواننا في دبي",
  "description": "تواصل مع Court Hub في دبي للاستفسار عن مضارب البادل والطلبات وإنشاء الملاعب. تعرف على رقم واتساب والهاتف والبريد الإلكتروني وعنواننا في الورقاء 3."
});

export default async function ContactPage() {
  const content = await getPageContent('contact', 'ar');
  return <ContactClient content={content} />;
}
