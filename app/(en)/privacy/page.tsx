import SiteHeader from '@/components/shared/SiteHeader';
import Footer from '@/components/home/Footer';

// noindex until real legal copy arrives — placeholder policy must not be
// indexed by search engines and mistaken for a binding privacy policy.
export const metadata = {
  title: 'Privacy Policy — Court Hub',
  robots: { index: false, follow: true },
};

// ─── PLACEHOLDER COPY — replace with client-provided copy (contract §8) ───
const COPY = {
  draftNotice: 'DRAFT — pending legal review',
  title: 'Privacy Policy',
  intro:
    'This policy explains what personal data Court Hub collects, why we collect it, and how to reach us about it. We collect only what we need to run the shop and respond to your court inquiries.',
  sections: [
    {
      heading: 'Data We Collect',
      body: 'When you place an order we collect your name, contact details, and delivery address to fulfil it; payments are handled by Stripe and we never see your full card details. When you submit a court-construction inquiry, your details and project information are stored in our inquiries database (hosted on Supabase) so our team can follow up. If you choose to contact us via WhatsApp, the conversation continues on WhatsApp under its own terms and privacy policy.',
    },
    {
      heading: 'No Marketing Without Consent',
      body: 'We do not send marketing messages unless you explicitly opt in — for example by asking to join our community list. You can withdraw consent at any time and we will stop contacting you.',
    },
    {
      heading: 'Your Data, Your Call',
      body: 'You can ask us to access, correct, or delete the personal data we hold about you at any time. Send your request through any of the contact methods on our contact page and we will respond promptly.',
    },
  ],
};
// ─── END PLACEHOLDER COPY ───

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-ink">
      <SiteHeader spacer />
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-lime font-bold mb-8">
          {COPY.draftNotice}
        </p>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white tracking-tight">
          {COPY.title}
        </h1>
        <p className="text-white/50 text-base md:text-lg leading-relaxed mt-6">{COPY.intro}</p>
        <div className="mt-12 space-y-10">
          {COPY.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display font-bold text-xl md:text-2xl text-white tracking-tight mb-3">
                {section.heading}
              </h2>
              <p className="text-white/50 leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
