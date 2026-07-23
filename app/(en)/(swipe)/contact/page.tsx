import ContactClient from '@/components/pages/ContactClient';
import { getPageContent } from '@/lib/content/get';

export const metadata = {
  title: 'Contact — Court Hub',
  description:
    'Reach Court Hub on WhatsApp for rackets, court construction and orders — plus phone, email, showroom details in Al Quoz, Dubai.',
};

export const revalidate = 300;

export default async function ContactPage() {
  const content = await getPageContent('contact');
  return <ContactClient content={content} />;
}
