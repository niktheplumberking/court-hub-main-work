'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import type { ContentMap } from '@/lib/content/get';
import { useCart } from '@/lib/cart-context';
import { useT, useLocalePath, useDir } from '@/lib/i18n/LocaleProvider';

/** One card on the rail, built from a real Supabase product. */
type RailItem = {
  key: string;
  href: string;
  title: string;
  brand: string | null;
  priceAed: number;
  image: string | null;
  tag: string | null;
  cart: { id: string; slug: string; title: string; price_aed: number; image: string | null; max_qty: number };
};

const SCROLL_STEP = 296; // ~one card (264px) + gap per click, matching the approved demo

function toRailItems(products: Product[], conditionLabel: Record<string, string>): RailItem[] {
  // Only products a customer can actually buy: sold-out items are skipped.
  return products
    .filter((p) => p.quantity > 0)
    .slice(0, 8)
    .map((p) => ({
      key: p.id,
      href: `/shop/${p.slug}`,
      title: p.title,
      brand: p.brand,
      priceAed: p.price_aed,
      image: p.images?.[0] ?? null,
      tag: p.condition ? (conditionLabel[p.condition] ?? null) : null,
      cart: {
        id: p.id,
        slug: p.slug,
        title: p.title,
        price_aed: p.price_aed,
        image: p.images?.[0] ?? null,
        max_qty: p.is_unique ? 1 : p.quantity,
      },
    }));
}

export default function TopSellersRail({
  products = [],
  content,
}: {
  products?: Product[];
  content: ContentMap;
}) {
  const { add, openDrawer } = useCart();
  const t = useT();
  const lp = useLocalePath();
  const dir = useDir();
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const conditionLabel: Record<string, string> = {
    new: t.shop.condNew,
    'like-new': t.shop.condLikeNew,
    good: t.shop.condGood,
    fair: t.shop.condFair,
  };
  const items = toRailItems(products, conditionLabel);

  // Arrows stay PHYSICAL (left arrow always scrolls the strip left). In RTL the
  // browser reports scrollLeft in [-max, 0], so normalize to distance-from-the-
  // physical-left-edge before deciding which arrow to disable.
  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    const fromLeft = dir === 'rtl' ? rail.scrollLeft + max : rail.scrollLeft;
    setAtStart(fromLeft <= 4);
    setAtEnd(fromLeft >= max - 4);
  }, [dir]);

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [updateEdges]);

  const scrollByStep = (dir: 1 | -1) =>
    railRef.current?.scrollBy({ left: dir * SCROLL_STEP, behavior: 'smooth' });

  const arrowClass =
    'flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-ink/20 text-ink transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-lime disabled:pointer-events-none disabled:opacity-25';

  // No buyable products (empty shop or DB unreachable): hide the whole band
  // rather than render an empty strip. After all hooks, so hook order is stable.
  if (items.length === 0) return null;

  return (
    <section data-cms="home:top_sellers" className="border-y border-ink/[.08] bg-white py-[88px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-ink/50">
              {content['home.top_sellers.eyebrow']}
            </p>
            <h2 className="font-display text-[clamp(30px,4.4vw,54px)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-ink">
              {content['home.top_sellers.heading']}
            </h2>
          </div>
          {/* Arrows are pointless on touch — hidden on coarse pointers. */}
          <div className="flex gap-2.5 [@media(hover:none)_and_(pointer:coarse)]:hidden">
            <button type="button" aria-label={t.shop.scrollLeft} disabled={atStart} onClick={() => scrollByStep(-1)} className={arrowClass}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-[17px] w-[17px]" aria-hidden>
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" aria-label={t.shop.scrollRight} disabled={atEnd} onClick={() => scrollByStep(1)} className={arrowClass}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-[17px] w-[17px]" aria-hidden>
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Rail with right-edge fade */}
        <div className="-mx-6 overflow-hidden px-6 [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-60px),transparent)]">
          <div
            ref={railRef}
            onScroll={updateEdges}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item) => (
              <div
                key={item.key}
                className="group w-[264px] flex-none snap-start overflow-hidden rounded-[24px] border border-ink/[.06] bg-sand transition-transform duration-200 hover:-translate-y-[5px]"
              >
                <Link href={lp(item.href)} className="relative block aspect-[1/1.08] overflow-hidden bg-sand-2">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="264px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-display text-sm tracking-widest text-ink/20">
                      COURT HUB
                    </span>
                  )}
                  {item.tag && (
                    <span className="absolute start-3 top-3 rounded-full bg-ink px-2.5 py-1.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] text-lime">
                      {item.tag}
                    </span>
                  )}
                </Link>
                <div className="px-[18px] pb-5 pt-4">
                  {item.brand && (
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ink/45">
                      {item.brand}
                    </p>
                  )}
                  <Link href={lp(item.href)} className="block">
                    <h3 className="mb-2.5 mt-1 font-display text-[15.5px] font-extrabold tracking-[-0.01em] text-ink">
                      {item.title}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <p className="font-display text-base font-extrabold text-court-blue">
                      <span className="me-1 font-mono text-[10px] font-bold text-ink/45">AED</span>
                      {item.priceAed.toLocaleString('en-AE', { maximumFractionDigits: 0 })}
                    </p>
                    <button
                      type="button"
                      aria-label={t.shop.addAria(item.title)}
                      onClick={() => {
                        add(item.cart, 1);
                        openDrawer();
                      }}
                      className="rounded-full bg-ink px-3.5 py-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-court-blue"
                    >
                      {t.shop.add}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-9 text-center">
          <Link
            href={lp('/shop')}
            className="inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-[15px] font-display text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-court-blue"
          >
            {content['home.top_sellers.cta']}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-[15px] w-[15px] rtl:-scale-x-100" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
