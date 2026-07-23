import SiteHeader from '@/components/shared/SiteHeader';
import Footer from '@/components/home/Footer';

// noindex until real legal copy arrives — placeholder terms must not be
// indexed by search engines and mistaken for binding legal text.
export const metadata = {
  title: 'Terms of Service — Court Hub',
  robots: { index: false, follow: true },
};

// ─── PLACEHOLDER COPY — replace with client-provided copy (contract §8) ───
const COPY = {
  draftNotice: 'DRAFT — pending legal review',
  title: 'Terms of Service',
  intro:
    'These terms govern your use of the Court Hub website, shop, and court-construction services. By placing an order or requesting a quote, you agree to the terms below.',
  sections: [
    {
      heading: 'Orders & Payment',
      body: 'All prices are listed in UAE Dirhams (AED). Payments are processed securely through Stripe; Court Hub does not store your card details. An order is confirmed once payment has been successfully processed and you receive an order confirmation.',
    },
    {
      heading: 'Shipping',
      body: 'We ship across the United Arab Emirates. Delivery timelines and any applicable shipping fees are shown at checkout before you pay. Risk in the goods passes to you on delivery.',
    },
    {
      heading: 'Returns on Pre-Owned Items',
      body: 'Many of our rackets are pre-owned and sold with their condition clearly described and photographed. Returns are accepted only where an item materially differs from its listed condition. Contact us within 48 hours of delivery to start a return.',
    },
    {
      heading: 'Court-Construction Quotes',
      body: 'Quotes for court construction are estimates based on the information you provide and remain subject to a site survey. A quote does not constitute a binding contract; project scope, pricing, and timelines are confirmed in a separate written agreement.',
    },
  ],
};
// ─── END PLACEHOLDER COPY ───

export default function TermsPage() {
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
