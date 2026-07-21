'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  Heart,
  SlidersHorizontal,
  ShoppingBag,
  CheckCircle,
} from 'lucide-react';
import Footer from '@/components/home/Footer';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { PRODUCTS } from '@/components/shop/placeholder-products';
import { useCart } from '@/lib/cart-context';
import type { Product } from '@/components/shop/placeholder-products';
import type { ContentMap } from '@/lib/content/get';

export default function ShopClient({ content }: { content: ContentMap }) {
  const { add, count, openDrawer } = useCart();
  const [activeBrand, setActiveBrand] = useState<'ALL' | 'STEALTH' | 'HEAD' | 'Wilson'>('ALL');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'rackets' | 'used' | 'accessories'>('ALL');

  const [favorites, setFavorites] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [flyers, setFlyers] = useState<{ id: number; x: number; y: number; p: Product }[]>([]);

  const blanketRef = useRef<HTMLDivElement>(null);

  // Hydrate favorites from localStorage (SSR-guarded)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem('courthub_favorites');
      if (cached) setFavorites(JSON.parse(cached));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('courthub_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleAdd = (p: Product, e: React.MouseEvent) => {
    const id = Date.now() + Math.random();
    setFlyers(prev => [...prev, { id, x: e.clientX, y: e.clientY, p }]);
    showToast(`Added ${p.name} to your bag!`);
    // Drive the cart from a deterministic timer — NOT the flyer's onAnimationComplete,
    // which Framer can pre-empt when an intervening re-render restarts the opacity
    // keyframe (the callback then never fires). After the ~0.7s flight: add the item
    // (FAB count ticks up), remove the flyer, then slide the drawer in.
    window.setTimeout(() => {
      add({ id: p.id, slug: p.id, title: p.name, price_aed: p.price, image: p.image, max_qty: 99 }, 1);
      setFlyers(prev => prev.filter(f => f.id !== id));
      window.setTimeout(() => openDrawer(), 260);
    }, 700);
  };

  const filteredProducts = PRODUCTS.filter(prod => {
    const matchesBrand = activeBrand === 'ALL' || prod.brand === activeBrand;
    const matchesCategory = activeCategory === 'ALL' || prod.category === activeCategory;
    return matchesBrand && matchesCategory;
  });

  return (
    <div className="bg-ink min-h-screen text-white selection:bg-lime/30">
      {/* No hero on Shop — the site navbar sits fixed at the top, always visible
          (desktop; mobile keeps the global top bar from <Header />). */}
      <HeroFrameNav active="shop" fixedBar />

      {/* Dynamic Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-lime text-ink px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-semibold text-xs tracking-wider uppercase border border-white/10"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying-number add-to-cart layer */}
      <div className="fixed inset-0 pointer-events-none z-[90]">
        {flyers.map((flyer) => {
          const fab = document.getElementById('cart-fab')?.getBoundingClientRect();
          const targetX = fab ? fab.left + fab.width / 2 : window.innerWidth - 44;
          const targetY = fab ? fab.top + fab.height / 2 : window.innerHeight - 44;
          return (
            <motion.div
              key={flyer.id}
              style={{ position: 'fixed', left: flyer.x, top: flyer.y, zIndex: 90 }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{ x: targetX - flyer.x, y: targetY - flyer.y, scale: 0.4, opacity: [1, 1, 0] }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="w-9 h-9 -ml-4 -mt-4 rounded-full bg-lime text-ink font-mono font-bold flex items-center justify-center shadow-lg pointer-events-none"
            >
              {count + 1}
            </motion.div>
          );
        })}
      </div>

      <main className="">

        {/* ================= BLANKET OVERLAY CONTENT ================= */}
        <div ref={blanketRef} className="relative z-10 bg-sand text-ink shadow-[0_-24px_50px_rgba(0,0,0,0.15)] border-t border-sand-2">
          {/* Fine spacing grid pattern for balanced quadrants and elegant reduced opacity (0.04) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,13,24,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(10,13,24,0.035)_1px,transparent_1px)] bg-[size:5.0rem_5.0rem] pointer-events-none" />

          {/* Catalog container — extra top padding clears the fixed site header now
              that the hero (which used to provide that offset) is gone. */}
          <div id="catalog" className="max-w-7xl mx-auto pt-28 sm:pt-32 pb-16 sm:pb-20 px-6 md:px-8 space-y-12 sm:space-y-16 relative z-10">

            {/* Collection Header Block aligned with reference image layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end pb-8 border-b border-ink/10">
              <div className="md:col-span-7 text-left space-y-3">
                <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.25em] text-ink/65 font-bold block">
                  {content['shop.header.eyebrow']}
                </span>
                <h2 className="text-4.5xl sm:text-5xl lg:text-6xl font-display font-black leading-[0.9] tracking-tighter uppercase text-ink">
                  {content['shop.header.heading_line1']} <br className="hidden sm:inline" />
                  <span className="text-court-blue">{content['shop.header.heading_highlight']}</span>
                </h2>
              </div>

              <div className="md:col-span-5 text-left md:text-right">
                <p className="text-ink/80 text-[11px] sm:text-xs leading-relaxed max-w-sm md:ml-auto font-mono uppercase tracking-wider font-semibold">
                  {content['shop.header.intro']}
                </p>
              </div>
            </div>

            {/* Sleek Custom-molded Filter Toolbar (Sleek Dark capsule on cream backdrop) */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-ink p-3 md:p-4 rounded-[28px] md:rounded-full border border-white/10 shadow-xl relative z-10 text-white">
              {/* Brand Filter Row */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/[0.03] rounded-full">
                {(['ALL', 'STEALTH', 'HEAD', 'Wilson'] as const).map(brand => {
                  const isActive = activeBrand === brand;
                  return (
                    <button
                      key={brand}
                      onClick={() => setActiveBrand(brand)}
                      className={`relative px-5 py-2.5 rounded-full text-[10px] sm:text-[11px] font-mono uppercase tracking-widest transition-all duration-300 outline-none cursor-pointer select-none font-bold ${
                        isActive ? 'text-ink' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="activeBrandFilter"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          className="absolute inset-0 bg-lime rounded-full -z-10"
                        />
                      )}
                      {brand}
                    </button>
                  );
                })}
              </div>

              {/* Category Filter Row */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-white/40 shrink-0" />
                  <div className="flex gap-1 bg-white/[0.03] p-1 rounded-full border border-white/5 relative">
                    {[
                      { id: 'ALL', label: 'All Items' },
                      { id: 'rackets', label: 'Pro Rackets' },
                      { id: 'used', label: 'Pre-Owned' },
                      { id: 'accessories', label: 'Gear & Balls' }
                    ].map(cat => {
                      const isActive = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id as any)}
                          className={`relative px-4 py-2 rounded-full text-[10px] sm:text-[11px] font-mono uppercase tracking-wider transition-colors duration-300 outline-none cursor-pointer select-none font-bold ${
                            isActive ? 'text-white bg-white/15' : 'text-white/45 hover:text-white/75'
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="activeCategoryFilter"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                              className="absolute inset-0 bg-white/10 rounded-full -z-10"
                            />
                          )}
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid - Expanded up to 4 columns on large screens for space */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeBrand}-${activeCategory}`}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.06 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
              >
                {filteredProducts.map((prod) => {
                  const isFav = favorites.includes(prod.id);
                  return (
                    <motion.div
                      key={prod.id}
                      className="group bg-white rounded-[20px] p-5 border border-ink/5 hover:border-ink/15 hover:shadow-[0_16px_48px_rgba(10,13,24,0.06)] flex flex-col justify-between transition-all duration-500 relative overflow-hidden text-left"
                    >
                      <div className="relative z-10 space-y-4">
                        {/* Soft premium grey-beige backplate for product photo. `isolate`
                            scopes the image's multiply blend so it composites only against
                            this box's cream — the product photos' white studio backgrounds
                            multiply to EXACTLY #F5F4F0 (white × box = box), so no white/black
                            rectangle ever shows. (racket-19/20 had their black bgs flood-filled
                            to white so they behave the same.) */}
                        <div className="relative w-full aspect-[4/3] rounded-[12px] bg-[#F5F4F0] overflow-hidden border border-ink/5 isolate">
                          <Link href={`/shop/${prod.id}`} className="block w-full h-full cursor-pointer">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-contain p-3 sm:p-4 mix-blend-multiply group-hover:scale-105 transition-transform duration-700 select-none"
                              referrerPolicy="no-referrer" loading="lazy" decoding="async"
                            />
                          </Link>

                          {/* Left Stacked badges like user screenshot */}
                          <div className="absolute top-4 left-4 flex flex-col gap-1 items-start pointer-events-none">
                            <span className="bg-[#1E5AE8] text-white text-[9px] font-mono font-black tracking-widest px-2.5 py-1 rounded-sm uppercase leading-none">
                              BEST SELLER
                            </span>
                            {prod.brand === 'STEALTH' && (
                              <span className="bg-[#E84525] text-white text-[9px] font-mono font-black tracking-widest px-2.5 py-1 rounded-sm uppercase leading-none">
                                10% OFF
                              </span>
                            )}
                            {prod.category === 'used' && (
                              <span className="bg-[#E84525] text-white text-[9px] font-mono font-black tracking-widest px-2.5 py-1 rounded-sm uppercase leading-none">
                                15% OFF
                              </span>
                            )}
                          </div>

                          {/* Heart Icon Toggle */}
                          <button
                            onClick={() => toggleFavorite(prod.id)}
                            className="absolute top-4 right-4 p-2 bg-white hover:bg-ink text-ink hover:text-white rounded-full transition-all cursor-pointer border border-ink/5 flex items-center justify-center shadow-sm"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'text-fire fill-[#E84525]' : 'text-ink/40 group-hover:text-ink'}`} />
                          </button>
                        </div>

                        {/* Meta section: Brand and Stock status */}
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.15em] font-bold text-ink/50">
                          <span>{prod.brand}</span>
                          <span className="flex items-center gap-1 text-ink/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                            IN STOCK
                          </span>
                        </div>

                        {/* Title & brief description */}
                        <div className="space-y-1">
                          <Link href={`/shop/${prod.id}`} className="block group/title">
                            <h3 className="text-base font-display font-black leading-tight text-ink uppercase tracking-tight group-hover/title:text-[#1E5AE8] transition-colors line-clamp-1">
                              {prod.name}
                            </h3>
                          </Link>
                          <p className="text-ink/60 text-xs leading-relaxed line-clamp-2 min-h-[32px]">
                            {prod.desc}
                          </p>
                        </div>
                      </div>

                      {/* Bottom row: Price and Add To Bag Button */}
                      <div className="relative z-10 pt-4 border-t border-ink/5 mt-4 flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          {prod.originalPrice ? (
                            <span className="text-ink/30 text-[10px] font-mono line-through leading-none">AED {prod.originalPrice}</span>
                          ) : (
                            <span className="text-ink/30 text-[10px] font-mono leading-none">AED {Math.round(prod.price * 1.15)}</span>
                          )}
                          <span className="text-lg font-display font-black text-ink">AED {prod.price}</span>
                        </div>

                        <button
                          onClick={(e) => handleAdd(prod, e)}
                          className="px-4.5 py-2.5 bg-ink text-white hover:bg-lime hover:text-ink rounded-full font-bold uppercase text-[9px] tracking-widest transition-all cursor-pointer flex items-center gap-1.5 hover:-translate-y-0.5 shadow-md shadow-black/5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                          <span>Add to bag</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer inside its own distinct contrast block */}
          <div className="bg-ink text-white relative z-10">
            <Footer hideTopBorder />
          </div>
        </div>
      </main>
    </div>
  );
}
