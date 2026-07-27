import LegalPage from '@/components/pages/LegalPage';
import { getPageContent } from '@/lib/content/get';

// noindex until real legal copy arrives — placeholder terms must not be
// indexed by search engines and mistaken for binding legal text. Flip to
// index:true once the client's reviewed legal copy is saved in the Studio.
export const metadata = {
  title: 'Terms of Service — Court Hub',
  robots: { index: false, follow: true },
};

export const revalidate = 300;

export default async function TermsPage() {
  const content = await getPageContent('terms');
  return <LegalPage page="terms" content={content} />;
}
