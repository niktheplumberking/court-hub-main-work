import LegalPage from '@/components/pages/LegalPage';
import { getPageContent } from '@/lib/content/get';

// noindex until real legal copy arrives — placeholder policy must not be
// indexed by search engines and mistaken for a binding privacy policy. Flip
// to index:true once the client's reviewed legal copy is saved in the Studio.
export const metadata = {
  title: 'Privacy Policy — Court Hub',
  robots: { index: false, follow: true },
};

export const revalidate = 300;

export default async function PrivacyPage() {
  const content = await getPageContent('privacy');
  return <LegalPage page="privacy" content={content} />;
}
