import Link from 'next/link';
import Reveal from './Reveal';

// The four inline SVGs are copied verbatim from the approved demo (isometric
// court, strung racket, refresh cycle with check seal, wrench over baseline).
// Their .st/.st2/.ac stroke classes are styled by .ch-svc-icon in globals.css.
// Pre-owned links to /shop — the shop has no URL-driven category filter yet.
const SERVICES = [
  {
    title: 'Court Construction',
    desc: 'Turnkey padel arenas built for desert heat — Spanish glass, galvanized frames, 145km/h wind rating.',
    go: 'Build yours →',
    href: '/construct-your-court',
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path className="st2" d="M4 12l12-6 12 6" />
        <path className="st" d="M4 12v10l12 6 12-6V12" />
        <path className="st" d="M16 16v12M4 12l12 4 12-4" />
        <path className="st2" d="M10 9v10M22 9v10" />
        <circle className="ac" cx="25.5" cy="8" r="3.2" />
      </svg>
    ),
  },
  {
    title: 'Racket Shop',
    desc: 'Elite rackets, balls and gear — curated drops from Stealth, HEAD, Wilson and more, priced in AED.',
    go: 'Shop now →',
    href: '/shop',
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path
          className="st"
          d="M16 3c5 0 8.6 3.4 8.6 8 0 4.2-3 7.4-6.6 8.2-.9.2-1.5.9-1.5 1.8V27a2.5 2.5 0 0 1-5 0v-6c0-.9-.6-1.6-1.5-1.8C6.4 18.4 7.4 3 16 3z"
          transform="translate(-1.6 0)"
        />
        <path className="st2" d="M11 8.5l7 7M14.5 6.5l7 7M9.5 12l6.5 6.5M18 5.5l3.5 3.5" />
        <circle className="ac" cx="26.5" cy="24.5" r="3.2" />
      </svg>
    ),
  },
  {
    title: 'Pre-Owned Rackets',
    desc: 'Inspected and re-gripped pro rackets at accessible prices — trade in your old racket for credit.',
    go: 'Browse pre-owned →',
    href: '/shop',
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path className="st" d="M27 16a11 11 0 0 1-19 7.6M5 16A11 11 0 0 1 24 8.4" />
        <path className="st" d="M24 3.5v5h-5M8 28.5v-5h5" />
        <path
          className="st2"
          d="M16 10.5c2.6 0 4.2 1.7 4.2 3.9 0 2-1.4 3.5-3.1 3.9-.5.1-.8.5-.8 1v2.2"
        />
        <circle className="ac" cx="26" cy="25" r="3.4" />
        <path
          d="M24.6 25l1 1 1.8-2"
          style={{
            stroke: 'var(--color-ink)',
            strokeWidth: 1.3,
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }}
        />
      </svg>
    ),
  },
  {
    title: 'Maintenance & Upgrades',
    desc: 'Turf renewal, lighting, smart cameras and acoustic dampening retrofits for existing courts.',
    go: 'Talk to us →',
    href: '/contact',
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path
          className="st"
          d="M20.5 4.5a6 6 0 0 0-7.8 7.8L5 20v4h4l7.7-7.7a6 6 0 0 0 7.8-7.8L20 13l-4-4 4.5-4.5z"
        />
        <path className="st2" d="M4 28h24M8 25v3M16 25v3M24 25v3" />
        <path className="ac" d="M26.5 17.5l1 2.3 2.3 1-2.3 1-1 2.3-1-2.3-2.3-1 2.3-1z" />
      </svg>
    ),
  },
];

export default function ServicesGrid() {
  return (
    <section id="services" className="scroll-mt-16 py-[88px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mb-11">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-ink/50">
            What we do
          </p>
          <h2 className="font-display text-[clamp(30px,4.4vw,54px)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-ink">
            Our Services
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 min-[561px]:grid-cols-2 min-[1001px]:grid-cols-4">
          {SERVICES.map((s) => (
            <Reveal key={s.title} className="h-full">
              <Link
                href={s.href}
                className="ch-svc group relative flex h-full flex-col gap-4 overflow-hidden rounded-[24px] border border-ink/[.08] bg-white px-[26px] py-[30px] transition-[transform,box-shadow] duration-200 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_rgba(14,14,12,0.1)]"
              >
                <div className="ch-svc-icon">{s.icon}</div>
                <h3 className="font-display text-[17px] font-extrabold uppercase tracking-[-0.01em] text-ink">
                  {s.title}
                </h3>
                <p className="flex-1 text-[13px] leading-relaxed text-ink/60">{s.desc}</p>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-court-blue group-hover:underline">
                  {s.go}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
