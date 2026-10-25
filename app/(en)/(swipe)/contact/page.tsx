import { pageMetadata } from '@/lib/seo';
import ContactClient from '@/components/pages/ContactClient';
import { getPageContent } from '@/lib/content/get';

export const metadata = pageMetadata("/contact", "en", {
  "title": "Contact Court Hub | WhatsApp, Phone & Dubai Address",
  "description": "Contact Court Hub in Dubai for padel rackets, orders and court construction. Find our WhatsApp, phone, email and Al Warqa 3 address."
});

export const revalidate = 300;

export default async function ContactPage() {
  const content = await getPageContent('contact');
  return <ContactClient content={content} />;
}
