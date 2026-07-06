import { Fragment } from 'react';

// Same catalog as the shop teaser's ticker (ShopSection BRANDS).
const BRANDS = ['STEALTH', 'DOPADEL', 'MUSA', 'WILSON', 'HEAD', 'BULLPADEL'];
// Content pre-duplicated 2x so the shared .ch-marquee translateX(0 → -50%)
// loop wraps seamlessly. It intentionally keeps moving (slowed via
// .ch-ribbon-track) under OS reduce-motion — see globals.css.
const TRACK = [...BRANDS, ...BRANDS];

export default function BrandRibbon() {
  return (
    <div
      aria-label="Brands we carry"
      className="ch-ribbon relative overflow-hidden bg-ink py-[26px] [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
    >
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
    </div>
  );
}
