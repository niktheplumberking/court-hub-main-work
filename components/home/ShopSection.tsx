'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShoppingBag, Star, ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatAED } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

// Display-only fallback for local dev without a Supabase connection.
// When the server fetch returns no products, these render as decorative
// cards that link to /shop (no fake per-product detail pages exist for them).
const FALLBACK_PRODUCTS = [
  {
    id: 'fallback-1',
    name: 'Speed Motion 2024',
    price: '1,049',
    brand: 'HEAD',
    image: '/images/premium_padel_racket_black_lime_1779706021226.webp',
    tag: 'Pro Series',
  },
  {
    id: 'fallback-2',
    name: 'Nighthawk Edition',
    price: '1,249',
    brand: 'STEALTH',
    image: '/images/premium_padel_racket_stealth_blue_1779706040552.webp',
    tag: 'Limited',
  },
  {
    id: 'fallback-3',
    name: 'Castor Limited',
    price: '879',
    brand: 'DOPADEL',
    image: '/images/premium_padel_racket_black_lime_1779706021226.webp',
    tag: 'Best Seller',
  },
];

// Real category links into the shop — slugs match supabase/schema.sql seed.
const CATEGORY_LINKS = [
  { label: 'New Rackets', href: '/shop?category=new-rackets' },
  { label: 'Pre-Owned', href: '/shop?category=pre-owned-rackets' },
  { label: 'Tennis Balls', href: '/shop?category=tennis-balls' },
];

const CONDITION_LABEL: Record<string, string> = {
  new: 'New',
  'like-new': 'Like New',
  good: 'Good',
  fair: 'Fair',
};

/** Normalized card shape so real products and the dev fallback share one renderer. */
type TeaserCard = {
  key: string;
  href: string;
  title: string;
  brand: string | null;
  priceLabel: string;
  image: string | null;
  badge: string | null;
};

interface ShopSectionProps {
  products?: Product[];
}

export default function ShopSection({ products = [] }: ShopSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const sellersRef = useRef<HTMLDivElement>(null);

  const BRANDS = ['STEALTH', 'DOPADEL', 'MUSA', 'WILSON', 'HEAD', 'BULLPADEL'];
  const duplicatedBrands = [...BRANDS, ...BRANDS, ...BRANDS, ...BRANDS];

  const cards: TeaserCard[] =
    products.length > 0
      ? products.slice(0, 6).map((p) => ({
          key: p.id,
          href: `/shop/${p.slug}`,
          title: p.title,
          brand: p.brand,
          priceLabel: formatAED(p.price_aed),
          image: p.images?.[0] ?? null,
          badge: p.condition ? CONDITION_LABEL[p.condition] ?? null : null,
        }))
      : FALLBACK_PRODUCTS.map((p) => ({
          key: p.id,
          href: '/shop',
          title: p.name,
          brand: p.brand,
          priceLabel: `AED ${p.price}`,
          image: p.image,
          badge: p.tag,
        }));

  // Scroll-in choreography: header line-rise (bible #5), pill + card stagger
  // reveals that reverse on scroll-up. gsap.from inside matchMedia means
  // reduced-motion users see everything statically — no opacity-0 dead states.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Header: masked line-rise
        gsap.from('[data-shop-line]', {
          yPercent: 110,
          duration: 1.0,
          ease: 'power4.out',
          stagger: 0.09,
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });

        // Header eyebrow + category pills
        gsap.from('[data-shop-rise]', {
          y: 20,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });

        // Top Sellers heading row + product cards
        gsap.from('[data-sellers-head]', {
          y: 24,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sellersRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
        gsap.from('[data-product-card]', {
          y: 40,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: sellersRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="shop" className="bg-ink py-20 md:py-32 px-6 md:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">

        {/* Header Section */}
        <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 md:gap-12">
          <div className="space-y-4 md:space-y-6">
            <div data-shop-rise className="flex items-center gap-4">
              <div className="h-[1px] w-12 bg-lime" />
              <span className="font-mono text-xs tracking-widest text-lime uppercase font-bold">The Rack</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-display font-extrabold leading-tight uppercase">
              <span className="block overflow-hidden">
                <span data-shop-line className="block">The paddles</span>
              </span>
              <span className="block overflow-hidden">
                <span data-shop-line className="block">
                  <span className="relative inline-block text-lime italic overflow-hidden pr-[0.06em]">
                    the pros play with.
                    <motion.span
                      className="absolute inset-0 select-none pointer-events-none"
                      style={{
                        backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 50%, transparent)",
                        backgroundSize: "200px 100%",
                        backgroundRepeat: "no-repeat",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                      animate={{
                        backgroundPosition: ["-100% 0", "150% 0"],
                        opacity: [0, 1, 0.8, 0]
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        repeatDelay: 5.5,
                        ease: [0.45, 0.05, 0.1, 1],
                        times: [0, 0.2, 0.6, 1]
                      }}
                    >
                      the pros play with.
                    </motion.span>
                  </span>
                </span>
              </span>
            </h2>
          </div>

          {/* Real category links into the shop (was a dead fake-filter group) */}
          <div className="flex flex-wrap gap-2 md:gap-4">
            {CATEGORY_LINKS.map((cat) => (
              <Link
                data-shop-rise
                key={cat.label}
                href={cat.href}
                className="px-6 py-2 md:px-8 md:py-3 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest border border-white/10 text-white/60 hover:border-lime hover:text-lime transition-colors duration-300"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bento Grid Deals */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto">
          {/* Main Deal Card */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="md:col-span-4 bg-ink-2 rounded-[30px] md:rounded-[40px] p-6 md:p-8 relative overflow-hidden flex flex-col justify-between border border-white/5 hover:border-lime/30 hover:shadow-[0_15px_30px_rgba(59,130,246,0.05)] transition-all duration-500 group min-h-[400px]"
          >
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <img loading="lazy" decoding="async"
                src="/images/premium_background.jpg?v=6"
                alt=""
                className="w-full h-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
            </div>

            <div className="z-10 flex justify-between items-start">
               <div className="space-y-1">
                 <span className="text-2xl md:text-3xl font-display font-bold italic">$420</span>
                 <p className="text-white/40 text-[10px] md:text-xs max-w-[180px]">Finder Pro Limited Edition x Ale Cervellati. Tour-proven carbon face.</p>
               </div>
               <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md px-2 py-1 md:px-3 md:py-1 rounded-full group-hover:bg-lime/20 transition-all duration-300">
                  <Star className="w-3 h-3 text-lime fill-lime group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] md:text-xs font-bold text-white">4.9</span>
               </div>
            </div>

            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none p-8">
               <img loading="lazy" decoding="async"
                src="/images/racket_lime_nobg.webp?v=6"
                alt="Lime Padel Racket"
                className="w-full h-full max-h-[300px] object-contain drop-shadow-[0_0_50px_rgba(59,130,246,0.35)] transition-transform duration-700 scale-[0.68] group-hover:scale-[0.76] group-hover:rotate-6"
              />
            </div>

            {/* Real funnel link (was a dead "Add to bag" + wishlist heart) */}
            <Link
              href="/shop?category=new-rackets"
              className="z-10 w-full py-4 bg-white text-ink rounded-full font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center gap-2 transition-colors duration-300 hover:bg-lime"
            >
              <ShoppingBag className="w-4 h-4" />
              Shop New Rackets
            </Link>
          </motion.div>

          {/* Right Section Bento */}
          <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Great Value Deals */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-ink-2 rounded-[30px] md:rounded-[40px] p-6 md:p-8 relative overflow-hidden flex items-center justify-between border border-white/5 hover:border-white/10 hover:shadow-2xl transition-all duration-500 group min-h-[200px]"
            >
              {/* Background Image Layer */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <img loading="lazy" decoding="async"
                  src="/images/premium_background_blue.webp?v=6"
                  alt=""
                  className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/80" />
              </div>

              <div className="flex flex-col gap-6 md:gap-8 z-10">
                <h3 className="text-2xl md:text-4xl font-display font-extrabold italic text-white leading-none">
                  Elite Outlet
                </h3>
                <p className="text-white/40 text-[10px] md:text-xs max-w-[200px]">Acquire past-season frames and tournament-certified rackets at up to 70% off.</p>
                {/* Real link into the pre-owned category (was a dead button) */}
                <Link
                  href="/shop?category=pre-owned-rackets"
                  className="group/cta self-start flex items-center gap-2 md:gap-3 bg-white text-ink px-5 md:px-6 py-2.5 md:py-3 rounded-full text-[10px] md:text-xs font-bold uppercase transition-colors duration-300 hover:bg-lime"
                >
                  Shop Now
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                </Link>
              </div>

              <div className="absolute -right-8 top-1/2 -translate-y-1/2 z-10 w-[45%] h-[110%] flex items-center justify-center pointer-events-none overflow-visible">
                <img loading="lazy" decoding="async"
                  src="/images/racket_blue_nobg.webp?v=6"
                  alt="Blue Padel Racket"
                  className="w-[110%] h-[110%] object-contain drop-shadow-[0_0_40px_rgba(30,90,232,0.3)] transition-transform duration-700 rotate-[15deg] scale-[0.74] group-hover:scale-[0.82] group-hover:rotate-[20deg]"
                />
              </div>
            </motion.div>

            {/* Exclusive Card */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="bg-court-blue rounded-[30px] md:rounded-[40px] p-6 md:p-8 relative overflow-hidden flex flex-col justify-between group border border-white/5 hover:border-white/20 transition-all duration-500 min-h-[250px]"
            >
              {/* Background Image Layer */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <img loading="lazy" decoding="async"
                  src="/images/premium_background_blue.webp?v=6"
                  alt=""
                  className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                  style={{ objectPosition: 'center 12%' }}
                />
                {/* 20% opacity blue cover overlay */}
                <div className="absolute inset-0 bg-court-blue/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
              </div>

              <div className="z-10 space-y-3 md:space-y-4">
                 <span className="bg-white text-court-blue px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Exclusive</span>
                 <h4 className="text-xl md:text-2xl font-display font-bold italic">Stealth Series</h4>
                 <div className="text-[9px] md:text-[10px] text-white/60 space-y-0.5 md:space-y-1 font-mono uppercase tracking-widest">
                    <p>Carbon Precision</p>
                    <p>Pro Line</p>
                 </div>
              </div>

              <div className="absolute right-0 bottom-0 z-10 h-full w-[55%] overflow-visible pointer-events-none flex items-end justify-end">
                 <img loading="lazy" decoding="async"
                  src="/images/racket_blue_nobg.webp?v=6"
                  alt="Blue Padel Racket"
                  className="h-[110%] object-contain translate-x-2 translate-y-6 rotate-[15deg] drop-shadow-[0_0_40px_rgba(30,90,232,0.35)] scale-[0.76] group-hover:scale-[0.84] group-hover:rotate-[18deg] transition-all duration-700"
                />
              </div>

              {/* Real link into the shop (was a dead icon button) */}
              <Link
                href="/shop"
                aria-label="Browse the full shop"
                className="z-10 flex items-center justify-center p-3.5 md:p-4 bg-white/10 backdrop-blur-md rounded-full w-fit group-hover:bg-white text-white group-hover:text-court-blue transition-all duration-300"
              >
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:-rotate-45" />
              </Link>
            </motion.div>

            {/* Super Sale Card */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.33, 1, 0.68, 1] }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="bg-ink-2 rounded-[30px] md:rounded-[40px] p-6 md:p-8 relative overflow-hidden flex flex-col justify-between border border-white/5 min-h-[250px] group"
            >
               {/* Background Image Layer */}
               <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                 <img loading="lazy" decoding="async"
                   src="/images/premium_background.jpg?v=6"
                   alt=""
                   className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                 />
                 <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
               </div>

               <div className="space-y-3 md:space-y-4 z-10">
                  <h4 className="text-xl md:text-2xl font-display font-bold text-white italic leading-tight">Speed Motion</h4>
                  <p className="text-white/60 text-[9px] md:text-[10px] font-medium">Carbon core. 50% off limited allocation.</p>
               </div>

               <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-visible">
                 <img loading="lazy" decoding="async"
                   src="/images/racket_lime_nobg.webp?v=6"
                   alt="Lime Padel Racket"
                   className="w-[60%] h-[60%] object-contain drop-shadow-2xl transition-transform duration-700 rotate-[85deg] scale-[0.9] translate-x-8 translate-y-2 group-hover:scale-[1.0]"
                 />
               </div>

               {/* Real link into the deals (was a card with no destination) */}
               <Link
                 href="/shop?category=new-rackets"
                 className="z-10 flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/50 hover:text-lime transition-colors duration-300 w-fit"
               >
                 View Deal
                 <ArrowRight className="w-4 h-4" />
               </Link>
            </motion.div>
          </div>
        </div>

        {/* Top Sellers Shelf — real products from Supabase (fallback: display-only cards) */}
        <div ref={sellersRef} className="space-y-8 md:space-y-12">
          <div data-sellers-head className="flex justify-between items-center">
            <h3 className="text-2xl md:text-3xl font-display font-bold italic tracking-tight">Top Sellers</h3>
            {/* Home funnel's most important link: label-flip + arrow-swap hover (bible #8) */}
            <Link
              href="/shop"
              className="group flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/40 hover:text-lime transition-colors duration-300"
            >
              <span className="relative block overflow-hidden">
                <span className="block transition-transform duration-[400ms] ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full">
                  View More
                </span>
                <span aria-hidden className="absolute inset-0 block translate-y-full transition-transform duration-[400ms] ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-y-0">
                  View More
                </span>
              </span>
              <span className="relative block overflow-hidden w-4 h-4 ml-1 md:ml-2">
                <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-x-[150%]" />
                <ArrowRight aria-hidden className="absolute inset-0 w-4 h-4 -translate-x-[150%] transition-transform duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-x-0" />
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {cards.map((card) => (
              <Link
                data-product-card
                key={card.key}
                href={card.href}
                className="group relative block bg-ink-2 rounded-[20px] overflow-hidden border border-white/5 hover:border-lime/30 transition-colors duration-500"
              >
                {/* Product image — hover scale 1 → 1.06 over 700ms (bible hover density) */}
                <div className="relative aspect-square overflow-hidden bg-ink-2">
                  {card.image ? (
                    <img loading="lazy" decoding="async"
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.06]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 font-display text-sm tracking-widest">
                      COURT HUB
                    </div>
                  )}
                  {card.badge && (
                    <span className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-black/60 backdrop-blur-md text-white/70 text-[8px] md:text-[9px] font-mono px-2 md:px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">
                      {card.badge}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 md:p-6 flex justify-between items-end gap-3">
                  <div className="space-y-1 min-w-0">
                    {card.brand && (
                      <p className="text-[9px] md:text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] truncate">{card.brand}</p>
                    )}
                    <h4 className="text-sm md:text-lg font-display font-bold leading-snug group-hover:text-lime transition-colors duration-300">
                      {card.title}
                    </h4>
                    <p className="text-xs md:text-sm font-display font-bold text-lime pt-1">{card.priceLabel}</p>
                  </div>
                  <span className="shrink-0 p-2.5 md:p-3 rounded-full bg-white/5 text-white/60 group-hover:bg-lime group-hover:text-ink transition-colors duration-300">
                    <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-300 group-hover:-rotate-45" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Brands Ticker (Scrolling & Fading at Grid Boundaries) */}
        <div
          className="pt-16 md:pt-24 border-t border-white/5 w-full overflow-hidden relative"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
          }}
        >
          {/* Pure-CSS brand ticker (.ch-marquee-reverse) so it keeps scrolling even
              with OS reduce-motion ON — Framer froze the old x:[-50%,0%] loop. */}
          <div
            className="ch-marquee-reverse flex items-center gap-12 md:gap-24 opacity-30 whitespace-nowrap w-max"
          >
             {duplicatedBrands.map((brand, idx) => (
               <span key={`${brand}-${idx}`} className="text-xl md:text-3xl font-display font-black tracking-tighter italic select-none">
                 {brand}
               </span>
             ))}
          </div>
        </div>

      </div>
    </section>
  );
}
