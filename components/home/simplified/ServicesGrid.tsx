import Link from 'next/link';
import Reveal from './Reveal';

// Exactly three services, in the client's order: Shop, Court Construction,
// Tournaments. Icons are Higgsfield-generated line-art tiles (cream bg, lime
// accent) stored in /public/assets/icons — they fill the .ch-svc-icon tile.
const SERVICES = [
  {
    title: 'Shop',
    desc: 'Elite rackets, balls and gear — curated drops from Stealth, HEAD, Wilson and more, priced in AED.',
    go: 'Shop now →',
    href: '/shop',
    icon: '/assets/icons/svc-shop.webp',
  },
  {
    title: 'Court Construction',
    desc: 'Turnkey padel arenas built for desert heat — Spanish glass, galvanized frames, 145km/h wind rating.',
    go: 'Build yours →',
    href: '/construct-your-court',
    icon: '/assets/icons/svc-construction.webp',
  },
  {
    title: 'Tournaments',
    desc: 'Sanctioned P25–P250 events across the UAE — live groups, brackets and the season leaderboard.',
    go: 'See the draw →',
    href: '/tournaments',
    icon: '/assets/icons/svc-tournaments.webp',
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

        <div className="grid grid-cols-1 gap-4 min-[561px]:grid-cols-3">
          {SERVICES.map((s) => (
            <Reveal key={s.title} className="h-full">
              <Link
                href={s.href}
                className="ch-svc group relative flex h-full flex-col gap-4 overflow-hidden rounded-[24px] border border-ink/[.08] bg-white px-[26px] py-[30px] transition-[transform,box-shadow] duration-200 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_rgba(14,14,12,0.1)]"
              >
                <div className="ch-svc-icon overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.icon} alt="" aria-hidden className="h-full w-full rounded-[17px] object-cover" loading="lazy" decoding="async" />
                </div>
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
