import ContactClient from '@/components/pages/ContactClient';
import { getPageContent } from '@/lib/content/get';

export const revalidate = 300;

export const metadata = {
  title: 'تواصل معنا — Court Hub',
  description:
    'تواصل مع Court Hub عبر واتساب للمضارب وإنشاء الملاعب والطلبات، إضافة إلى الهاتف والبريد الإلكتروني وتفاصيل صالة العرض في القوز بدبي.',
  alternates: { canonical: '/ar/contact', languages: { en: '/contact', ar: '/ar/contact', 'x-default': '/contact' } },
};

export default async function ContactPage() {
  const content = await getPageContent('contact', 'ar');
  return <ContactClient content={content} />;
}
