'use client';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, SearchX } from 'lucide-react';
import { CONTENT_DEFAULTS, type ContentPage } from '@/lib/content/get';
import { STUDIO_PAGES, sectionForKey, type StudioPage, type StudioSection } from '@/lib/content/sections';
import FieldCard from './FieldCard';
import PreviewPane from './PreviewPane';

// ─── Pure helpers ────────────────────────────────────────────────────────────

/** Keys of every editable field, grouped by page then section (registry order). */
function buildSectionKeys(): Record<ContentPage, Record<string, string[]>> {
  const byPage = {} as Record<ContentPage, Record<string, string[]>>;
  for (const p of STUDIO_PAGES) {
    byPage[p.page] = {};
    for (const s of p.sections) byPage[p.page][s.id] = [];
  }
  for (const key of Object.keys(CONTENT_DEFAULTS)) {
    const hit = sectionForKey(key);
    if (hit) byPage[hit.page.page][hit.section.id].push(key);
  }
  // Within a section, follow the registry's prefix display order (topic1..4 …).
  for (const p of STUDIO_PAGES) {
    for (const s of p.sections) {
      const rank = (key: string) => {
        const i = s.prefixes.indexOf(key.split('.')[1]);
        return i === -1 ? s.prefixes.length : i;
      };
      byPage[p.page][s.id].sort((a, b) => rank(a) - rank(b));
    }
  }
  return byPage;
}

const SECTION_KEYS = buildSectionKeys();

// ─── Studio ──────────────────────────────────────────────────────────────────

/**
 * Site Content Studio: page tabs → plain-English sections (accordion) →
 * field editors, with the real site previewed live alongside. `overrides`
 * are the current site_content rows; everything else falls back to the
 * shipped defaults, so "edited" always means "differs from the original".
 */
export default function ContentStudio({ overrides }: { overrides: Record<string, string> }) {
  // Saved values (site_content rows), kept current as saves/resets land.
  const [saved, setSaved] = useState<Record<string, string>>(overrides);
  const [activePageId, setActivePageId] = useState<ContentPage>(STUDIO_PAGES[0].page);
  // null = "auto": first section with an edited field, else the first section.
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [saveCount, setSaveCount] = useState(0);

  const page = STUDIO_PAGES.find((p) => p.page === activePageId) ?? STUDIO_PAGES[0];
  const pageSectionKeys = SECTION_KEYS[page.page];

  // Live value shown on the site (mirrors getPageContent's non-empty rule).
  const currentValue = (key: string) => {
    const o = saved[key];
    return typeof o === 'string' && o.length > 0 ? o : CONTENT_DEFAULTS[key].value;
  };
  const isEdited = (key: string) => currentValue(key) !== CONTENT_DEFAULTS[key].value;

  const editedCountByPage = useMemo(() => {
    const counts = {} as Record<ContentPage, number>;
    for (const p of STUDIO_PAGES) {
      counts[p.page] = Object.values(SECTION_KEYS[p.page])
        .flat()
        .filter(isEdited).length;
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const defaultOpenId =
    page.sections.find((s) => pageSectionKeys[s.id].some(isEdited))?.id ??
    page.sections[0]?.id;
  const openId = openSectionId ?? defaultOpenId;
  const openSection = page.sections.find((s) => s.id === openId);

  // ── Search (active page; other pages surfaced as switch-chips) ────────────
  const q = query.trim().toLowerCase();
  const matches = (key: string) =>
    CONTENT_DEFAULTS[key].label.toLowerCase().includes(q) ||
    currentValue(key).toLowerCase().includes(q);
  const searchGroups = q
    ? page.sections
        .map((s) => ({ section: s, keys: pageSectionKeys[s.id].filter(matches) }))
        .filter((g) => g.keys.length > 0)
    : [];
  const searchTotal = searchGroups.reduce((n, g) => n + g.keys.length, 0);
  const otherPageMatches = q
    ? STUDIO_PAGES.filter((p) => p.page !== page.page)
        .map((p) => ({
          page: p,
          count: Object.values(SECTION_KEYS[p.page]).flat().filter(matches).length,
        }))
        .filter((m) => m.count > 0)
    : [];

  // ── Save / reset plumbing shared by every FieldCard ────────────────────────
  const handleSaved = (key: string, value: string) => {
    setSaved((prev) => ({ ...prev, [key]: value }));
    setSaveCount((n) => n + 1);
  };
  const handleReset = (key: string) => {
    setSaved((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSaveCount((n) => n + 1);
  };

  const switchPage = (id: ContentPage) => {
    setActivePageId(id);
    setOpenSectionId(null); // re-derive the auto-open section for the new page
  };

  // Click-to-edit: the preview iframe (loaded with ?cmsedit=1) posts a
  // {page, section} when the editor clicks a highlighted section on the live
  // site. Jump the studio to that page + open that section.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data;
      if (!data || data.source !== 'courthub-cms' || data.type !== 'cms-edit') return;
      const target = STUDIO_PAGES.find((p) => p.page === data.page);
      if (!target) return;
      const sectionExists = target.sections.some((s) => s.id === data.section);
      setQuery('');
      setActivePageId(target.page);
      setOpenSectionId(sectionExists ? data.section : null);
      // Bring the studio (parent) into view in case it was scrolled away.
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const renderField = (key: string) => (
    <FieldCard
      key={key}
      fieldKey={key}
      label={CONTENT_DEFAULTS[key].label}
      type={CONTENT_DEFAULTS[key].type}
      defaultValue={CONTENT_DEFAULTS[key].value}
      savedValue={currentValue(key)}
      onSaved={handleSaved}
      onReset={handleReset}
    />
  );

  return (
    <div className="adm-grid-bg space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="adm-fade-up flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="space-y-2">
          <p className="adm-eyebrow">/// SITE CONTENT STUDIO</p>
          <h1 className="font-display text-3xl md:text-4xl font-black uppercase italic text-white">
            Edit the <span className="text-lime">site</span>
          </h1>
          <p className="text-sm text-white/50 max-w-xl">
            Pick a page, open a section, change the words — Save puts it live in
            seconds.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this page's copy…"
            aria-label="Search content fields on this page"
            // Inline pad wins over .adm-input's `padding` shorthand (which was
            // resetting padding-left and letting text slide under the icon).
            style={{ paddingLeft: '2.5rem' }}
            className="adm-input [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>
      </header>

      {/* ── Page tabs ──────────────────────────────────────────────────────── */}
      <div
        aria-label="Site pages"
        className="adm-fade-up flex flex-wrap gap-2"
        style={{ '--adm-delay': '0.06s' } as React.CSSProperties}
      >
        {STUDIO_PAGES.map((p) => {
          const active = p.page === page.page;
          const edited = editedCountByPage[p.page];
          return (
            <button
              key={p.page}
              type="button"
              aria-pressed={active}
              onClick={() => switchPage(p.page)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-widest transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime ${
                active
                  ? 'bg-lime text-ink font-bold'
                  : 'border border-white/15 text-white/60 hover:border-lime/50 hover:text-lime'
              }`}
            >
              {p.title}
              {edited > 0 && (
                <span
                  title={`${edited} edited field${edited === 1 ? '' : 's'}`}
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono font-bold leading-none ${
                    active ? 'bg-ink/15 text-ink' : 'bg-lime/15 text-lime'
                  }`}
                >
                  {edited}
                </span>
              )}
              {p.path === null && (
                <span
                  title="Not currently shown on the site"
                  className={`rounded-full border px-1.5 py-0.5 text-[9px] font-mono lowercase tracking-wider leading-none ${
                    active ? 'border-ink/30 text-ink/70' : 'border-white/20 text-white/40'
                  }`}
                >
                  hidden
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Workbench: sections left, live preview right. The preview column
          stretches to the row height (no items-start) so its sticky pane can
          travel while long section lists scroll. ─────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(380px,44%)]">
        <div className="min-w-0 space-y-3" key={`${page.page}|${q ? 'search' : 'browse'}`}>
          {q ? (
            <SearchResults
              page={page}
              query={query}
              groups={searchGroups}
              total={searchTotal}
              otherPages={otherPageMatches}
              onSwitchPage={switchPage}
              renderField={renderField}
            />
          ) : (
            page.sections.map((section, i) => (
              <AccordionSection
                key={section.id}
                section={section}
                index={i}
                keys={pageSectionKeys[section.id]}
                editedCount={pageSectionKeys[section.id].filter(isEdited).length}
                open={section.id === openId}
                onOpen={() => setOpenSectionId(section.id)}
                renderField={renderField}
              />
            ))
          )}
        </div>

        <div className="hidden min-w-0 lg:block">
          <PreviewPane page={page} anchor={openSection?.anchor} reloadKey={saveCount} />
        </div>
      </div>
    </div>
  );
}

// ─── Accordion section ───────────────────────────────────────────────────────

function AccordionSection({
  section,
  index,
  keys,
  editedCount,
  open,
  onOpen,
  renderField,
}: {
  section: StudioSection;
  index: number;
  keys: string[];
  editedCount: number;
  open: boolean;
  onOpen: () => void;
  renderField: (key: string) => React.ReactNode;
}) {
  return (
    <section
      className="adm-card adm-fade-up overflow-hidden"
      style={{ '--adm-delay': `${0.1 + index * 0.06}s` } as React.CSSProperties}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`studio-section-${section.id}`}
        onClick={onOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lime rounded-[20px]"
      >
        <span className="min-w-0 space-y-0.5">
          <span className="block font-display text-sm font-extrabold uppercase text-white">
            {section.title}
          </span>
          <span className="block text-xs text-white/40">{section.hint}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          <span className="text-[11px] font-mono text-white/30 whitespace-nowrap">
            {keys.length} field{keys.length === 1 ? '' : 's'}
          </span>
          {editedCount > 0 && (
            <span className="rounded-full border border-lime/25 bg-lime/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-lime whitespace-nowrap">
              {editedCount} edited
            </span>
          )}
          <ChevronDown
            aria-hidden
            className={`h-4 w-4 text-white/40 transition-transform duration-300 ${
              open ? 'rotate-180 text-lime' : ''
            }`}
          />
        </span>
      </button>

      {/* Smooth open/close via the grid-rows 0fr→1fr trick: pure CSS, content
          stays mounted so in-progress drafts survive collapsing a section. */}
      <div
        className={`grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div id={`studio-section-${section.id}`} className="min-h-0 overflow-hidden" inert={!open}>
          <div className="flex flex-col gap-3 px-5 pb-5 pt-1">
            {keys.map((key, j) => (
              <div
                key={key}
                className="adm-fade-up"
                style={{ '--adm-delay': `${Math.min(j, 6) * 0.05}s` } as React.CSSProperties}
              >
                {renderField(key)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Search results ──────────────────────────────────────────────────────────

function SearchResults({
  page,
  query,
  groups,
  total,
  otherPages,
  onSwitchPage,
  renderField,
}: {
  page: StudioPage;
  query: string;
  groups: { section: StudioSection; keys: string[] }[];
  total: number;
  otherPages: { page: StudioPage; count: number }[];
  onSwitchPage: (id: ContentPage) => void;
  renderField: (key: string) => React.ReactNode;
}) {
  return (
    <div className="adm-fade-up space-y-5">
      <p className="text-xs font-mono uppercase tracking-widest text-white/40" role="status">
        {total === 0
          ? `No matches on ${page.title}`
          : `${total} match${total === 1 ? '' : 'es'} on ${page.title}`}
        <span className="text-white/25"> for &ldquo;{query.trim()}&rdquo;</span>
      </p>

      {total === 0 && (
        <div className="adm-card p-6 space-y-2">
          <SearchX className="h-5 w-5 text-white/40" aria-hidden />
          <p className="text-sm text-white/70">
            Nothing on this page mentions &ldquo;{query.trim()}&rdquo;.
          </p>
          <p className="text-xs text-white/40">
            {otherPages.length > 0
              ? 'Good news though — it shows up on another page:'
              : 'Try a different word, or switch pages with the tabs above.'}
          </p>
        </div>
      )}

      {groups.map(({ section, keys }) => (
        <div key={section.id} className="space-y-3">
          <p className="text-[11px] font-mono uppercase tracking-widest text-lime/70">
            {section.title}
          </p>
          <div className="flex flex-col gap-3">{keys.map(renderField)}</div>
        </div>
      ))}

      {otherPages.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-white/30">
            Also found on
          </span>
          {otherPages.map(({ page: p, count }) => (
            <button
              key={p.page}
              type="button"
              onClick={() => onSwitchPage(p.page)}
              className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-mono text-white/60 hover:border-lime/50 hover:text-lime transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
            >
              {p.title} · {count} match{count === 1 ? '' : 'es'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
