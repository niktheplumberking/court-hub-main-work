import SiteHeader from '@/components/shared/SiteHeader';
import Footer from '@/components/home/Footer';
import type { ContentMap } from '@/lib/content/get';

/**
 * Shared renderer for the two legal pages (Terms / Privacy) — fully driven by
 * the Site Content system so the client edits legal copy from the admin
 * Content Studio, no developer needed.
 *
 * Conventions (mirrored in the Studio field hints):
 *  - `<page>.header.notice`: the draft badge; the value "-" hides it.
 *  - `<page>.section1..6`: heading+body pairs; a section renders only when
 *    BOTH parts are non-empty, so spare sections stay invisible until used.
 */
export default function LegalPage({ page, content }: { page: 'terms' | 'privacy'; content: ContentMap }) {
  const notice = content[`${page}.header.notice`]?.trim() ?? '';
  const sections = [1, 2, 3, 4, 5, 6]
    .map((i) => ({
      heading: content[`${page}.section${i}.heading`]?.trim() ?? '',
      body: content[`${page}.section${i}.body`]?.trim() ?? '',
    }))
    .filter((s) => s.heading && s.body);

  return (
    <main className="min-h-screen bg-ink">
      <SiteHeader spacer />
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-16">
        <div data-cms={`${page}:header`}>
          {notice && notice !== '-' && (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-lime font-bold mb-8">
              {notice}
            </p>
          )}
          <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white tracking-tight">
            {content[`${page}.header.title`]}
          </h1>
          <p className="text-white/50 text-base md:text-lg leading-relaxed mt-6 whitespace-pre-line">
            {content[`${page}.header.intro`]}
          </p>
        </div>
        <div className="mt-12 space-y-10" data-cms={`${page}:sections`}>
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display font-bold text-xl md:text-2xl text-white tracking-tight mb-3">
                {section.heading}
              </h2>
              <p className="text-white/50 leading-relaxed whitespace-pre-line">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
