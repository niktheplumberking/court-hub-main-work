import { pageMetadata } from '@/lib/seo';
import ConstructClient from '@/components/pages/ConstructClient';
import { getPageContent } from '@/lib/content/get';

export const metadata = pageMetadata("/construct-your-court", "en", {
  "title": "Padel Court Construction in Dubai & UAE | Court Hub",
  "description": "Discuss your padel court construction project with Court Hub. Share your name, contact details and court location, then speak with our team on WhatsApp."
});

export const revalidate = 300;

export default async function Page() {
  const content = await getPageContent('construct');
  return <ConstructClient content={content} />;
}
