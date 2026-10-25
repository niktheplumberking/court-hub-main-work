import { pageMetadata, absoluteUrl } from '@/lib/seo';
import LegalPage from '@/components/pages/LegalPage';
import { getPageContent } from '@/lib/content/get';

// noindex until real legal copy arrives — placeholder terms must not be
// indexed by search engines and mistaken for binding legal text. Flip to
// index:true once the client's reviewed legal copy is saved in the Studio.
export const metadata = { ...pageMetadata('/terms', 'en', { title: 'Terms of Service | Court Hub', description: 'Read the current Court Hub terms of service.', noindex: true }), alternates: { canonical: absoluteUrl('/terms') } };

export const revalidate = 300;

export default async function TermsPage() {
  const content = await getPageContent('terms');
  return <LegalPage page="terms" content={content} />;
}
