import { pageMetadata, absoluteUrl } from '@/lib/seo';
import LegalPage from '@/components/pages/LegalPage';
import { getPageContent } from '@/lib/content/get';

// noindex until real legal copy arrives — placeholder policy must not be
// indexed by search engines and mistaken for a binding privacy policy. Flip
// to index:true once the client's reviewed legal copy is saved in the Studio.
export const metadata = { ...pageMetadata('/privacy', 'en', { title: 'Privacy Policy | Court Hub', description: 'Read the current Court Hub privacy policy and contact information.', noindex: true }), alternates: { canonical: absoluteUrl('/privacy') } };

export const revalidate = 300;

export default async function PrivacyPage() {
  const content = await getPageContent('privacy');
  return <LegalPage page="privacy" content={content} />;
}
