import { supabaseServer } from '@/lib/supabase/server';
import ContentFieldEditor from '@/components/admin/ContentFieldEditor';
import { CONTENT_DEFAULTS, type ContentPage } from '@/lib/content/get';

export const dynamic = 'force-dynamic';

const PAGE_META: { page: ContentPage; title: string; note?: string }[] = [
  { page: 'home', title: 'Home' },
  { page: 'about', title: 'About Us' },
  { page: 'contact', title: 'Contact Us' },
  { page: 'construct', title: 'Construct Your Court' },
  { page: 'faq', title: 'FAQ', note: 'This section is not currently shown on the site — edits are kept for when it returns.' },
];

export default async function AdminContent() {
  // Current overrides (public-read RLS; middleware already gates /admin).
  // Fails soft to defaults-only when the DB is unreachable (e.g. local dev
  // without Supabase env) — same philosophy as getPageContent().
  const overrides = new Map<string, string>();
  try {
    const supabase = await supabaseServer();
    const { data: rows } = await supabase.from('site_content').select('key,value');
    for (const row of rows ?? []) {
      if (typeof row.value === 'string') overrides.set(row.key, row.value);
    }
  } catch (e) {
    console.error('[admin/content] override fetch failed — showing defaults', e);
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-black uppercase text-white">Site Content</h1>
        <p className="text-sm text-white/50 max-w-2xl">
          Edit the site&apos;s wording and designated images. Layout, colors and
          animations are fixed by design and can&apos;t be broken from here.
          Saved changes appear on the live site right away.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {PAGE_META.map((p) => (
            <a
              key={p.page}
              href={`#content-${p.page}`}
              className="text-[11px] font-mono uppercase tracking-widest text-white/60 border border-white/15 rounded-full px-3.5 py-1.5 hover:text-lime hover:border-lime/40"
            >
              {p.title}
            </a>
          ))}
        </div>
      </div>

      {PAGE_META.map(({ page, title, note }) => {
        const fields = Object.entries(CONTENT_DEFAULTS).filter(([, f]) => f.page === page);
        return (
          <section key={page} id={`content-${page}`} className="scroll-mt-24 space-y-4">
            <div className="flex items-baseline gap-3 border-b border-white/10 pb-3">
              <h2 className="font-display text-lg font-extrabold uppercase text-white">{title}</h2>
              <span className="text-[11px] font-mono text-white/30">{fields.length} fields</span>
            </div>
            {note && <p className="text-xs text-white/40 italic">{note}</p>}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {fields.map(([key, field]) => (
                <ContentFieldEditor
                  key={key}
                  fieldKey={key}
                  label={field.label}
                  type={field.type}
                  value={overrides.get(key) ?? field.value}
                  overridden={overrides.has(key)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
