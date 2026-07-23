import Link from 'next/link';
import Reveal from './Reveal';
import { localePath, type Locale } from '@/lib/i18n/locale';
import type { ContentMap } from '@/lib/content/get';

export default function ServicesGrid({
  content,
  locale = 'en',
}: {
  content: ContentMap;
  locale?: Locale;
}) {
  // Exactly three services, in the client's order: Shop, Court Construction,
  // Tournaments. Icons are Higgsfield-generated line-art tiles (cream bg, lime
  // accent) stored in /public/assets/icons — they fill the .ch-svc-icon tile.
  const services = [
    {
      title: content['home.services.card1.title'],
      desc: content['home.services.card1.desc'],
      go: content['home.services.card1.cta'],
      href: '/shop',
      icon: content['home.services.card1.icon'],
    },
    {
      title: content['home.services.card2.title'],
      desc: content['home.services.card2.desc'],
      go: content['home.services.card2.cta'],
      href: '/construct-your-court',
      icon: content['home.services.card2.icon'],
    },
    {
      title: content['home.services.card3.title'],
      desc: content['home.services.card3.desc'],
      go: content['home.services.card3.cta'],
      href: '/tournaments',
      icon: content['home.services.card3.icon'],
    },
  ];

  return (
    <section id="services" data-cms="home:services" className="scroll-mt-16 py-[88px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mb-11">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-ink/50">
            {content['home.services.eyebrow']}
          </p>
          <h2 className="font-display text-[clamp(30px,4.4vw,54px)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-ink">
            {content['home.services.heading']}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 min-[561px]:grid-cols-3">
          {services.map((s) => (
            <Reveal key={s.title} className="h-full">
              <Link
                href={localePath(locale, s.href)}
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
