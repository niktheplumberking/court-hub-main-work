import { Fragment } from 'react';
import { getDict } from '@/lib/i18n/dict';
import type { Locale } from '@/lib/i18n/locale';

// Same catalog as the shop teaser's ticker (ShopSection BRANDS).
const BRANDS = ['STEALTH', 'DOPADEL', 'MUSA', 'WILSON', 'HEAD', 'BULLPADEL'];
// Content pre-duplicated 2x so the shared .ch-marquee translateX(0 → -50%)
// loop wraps seamlessly. It intentionally keeps moving (slowed via
// .ch-ribbon-track) under OS reduce-motion — see globals.css.
const TRACK = [...BRANDS, ...BRANDS];

export default function BrandRibbon({ locale = 'en' }: { locale?: Locale }) {
  const t = getDict(locale);
  return (
    <div aria-label={t.pages.brandsAria} className="ch-ribbon relative overflow-hidden bg-ink py-[26px]">
      <div className="ch-marquee ch-ribbon-track flex w-max items-center gap-[72px] whitespace-nowrap">
        {TRACK.map((brand, i) => (
          <Fragment key={`${brand}-${i}`}>
            <span className="select-none font-display text-[26px] font-black italic tracking-[-0.03em] text-white/[.32] transition-colors duration-250 hover:text-lime">
              {brand}
            </span>
            <i aria-hidden className="h-1.5 w-1.5 flex-none rounded-full bg-lime opacity-50" />
          </Fragment>
        ))}
      </div>
      {/* Edge fades blend to the strip's own ink — NOT a mask (a mask punched
          through to the sand page background and read as white smears). */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-ink to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
