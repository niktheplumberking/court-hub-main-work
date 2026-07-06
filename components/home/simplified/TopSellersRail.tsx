'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { PRODUCTS as PLACEHOLDER_PRODUCTS } from '@/components/shop/placeholder-products';

const CONDITION_LABEL: Record<string, string> = {
  new: 'New',
  'like-new': 'Like New',
  good: 'Good',
  fair: 'Fair',
};

/** Real Supabase products and the local-dev placeholder fallback share one card shape. */
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

function toRailItems(products: Product[]): RailItem[] {
  if (products.length > 0) {
    return products.slice(0, 8).map((p) => ({
      key: p.id,
      href: `/shop/${p.slug}`,
      title: p.title,
      brand: p.brand,
      priceAed: p.price_aed,
      image: p.images?.[0] ?? null,
      tag: p.condition ? (CONDITION_LABEL[p.condition] ?? null) : null,
      cart: {
        id: p.id,
        slug: p.slug,
        title: p.title,
        price_aed: p.price_aed,
        image: p.images?.[0] ?? null,
        max_qty: p.is_unique ? 1 : Math.max(1, p.quantity),
      },
    }));
  }
  // Placeholder catalog fallback (same as AboutClient's best sellers) — these
  // have real /shop/[slug] detail pages and are addable to the real cart.
  return PLACEHOLDER_PRODUCTS.slice(0, 8).map((p) => ({
    key: p.id,
    href: `/shop/${p.id}`,
    title: p.name,
    brand: p.brand,
    priceAed: p.price,
    image: p.image,
    tag: p.tag.split('·')[0].trim(),
    cart: { id: p.id, slug: p.id, title: p.name, price_aed: p.price, image: p.image, max_qty: 99 },
  }));
}

export default function TopSellersRail({ products = [] }: { products?: Product[] }) {
  const { add, openDrawer } = useCart();
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const items = toRailItems(products);

  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setAtStart(rail.scrollLeft <= 4);
    setAtEnd(rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 4);
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [updateEdges]);

  const scrollByStep = (dir: 1 | -1) =>
    railRef.current?.scrollBy({ left: dir * SCROLL_STEP, behavior: 'smooth' });

  const arrowClass =
    'flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-ink/20 text-ink transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-lime disabled:pointer-events-none disabled:opacity-25';

  return (
    <section className="border-y border-ink/[.08] bg-white py-[88px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-ink/50">
              Best sellers
            </p>
            <h2 className="font-display text-[clamp(30px,4.4vw,54px)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-ink">
              Shop Top Sellers
            </h2>
          </div>
          {/* Arrows are pointless on touch — hidden on coarse pointers. */}
          <div className="flex gap-2.5 [@media(hover:none)_and_(pointer:coarse)]:hidden">
            <button type="button" aria-label="Scroll left" disabled={atStart} onClick={() => scrollByStep(-1)} className={arrowClass}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-[17px] w-[17px]" aria-hidden>
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" aria-label="Scroll right" disabled={atEnd} onClick={() => scrollByStep(1)} className={arrowClass}>
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
                <Link href={item.href} className="relative block aspect-[1/1.08] overflow-hidden bg-sand-2">
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
                    <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] text-lime">
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
                  <Link href={item.href} className="block">
                    <h3 className="mb-2.5 mt-1 font-display text-[15.5px] font-extrabold tracking-[-0.01em] text-ink">
                      {item.title}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <p className="font-display text-base font-extrabold text-court-blue">
                      <span className="mr-1 font-mono text-[10px] font-bold text-ink/45">AED</span>
                      {item.priceAed.toLocaleString('en-AE', { maximumFractionDigits: 0 })}
                    </p>
                    <button
                      type="button"
                      aria-label={`Add ${item.title} to cart`}
                      onClick={() => {
                        add(item.cart, 1);
                        openDrawer();
                      }}
                      className="rounded-full bg-ink px-3.5 py-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-court-blue"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-9 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-[15px] font-display text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-court-blue"
          >
            Shop All Products
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-[15px] w-[15px]" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
