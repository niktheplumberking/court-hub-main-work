'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ShoppingBag,
  Heart,
  Check,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  Share2,
  ChevronRight,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Star,
  Zap
} from 'lucide-react';
import type { ShopProduct } from '@/lib/shop/catalog';
import { useCart } from '@/lib/cart-context';
import { useT, useLocalePath, useDirSign } from '@/lib/i18n/LocaleProvider';
import Footer from '@/components/home/Footer';

// Shared reveal vocabulary — matches the fade-up rhythm used across the other
// pages so the product page no longer feels animation-starved next to them.
const RISE_EASE = [0.25, 1, 0.5, 1] as const;
const colLeft = (sign: 1 | -1) => ({
  hidden: { opacity: 0, x: -28 * sign },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: RISE_EASE } },
});
const colRight = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: RISE_EASE, delay: 0.08 } },
};
const gridParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: RISE_EASE } },
};
const sectionReveal = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: RISE_EASE } },
};

export default function ProductClient({
  product,
  related,
}: {
  product: ShopProduct | null;
  related: ShopProduct[];
}) {
  const { add, openDrawer } = useCart();
  const t = useT();
  const lp = useLocalePath();
  const dirSign = useDirSign();

  // Core Hooks for favorites syncing with localStorage (cart now handled globally)
  const [favorites, setFavorites] = useState<string[]>([]);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Accordion open section indicator
  const [openSection, setOpenSection] = useState<'specs' | 'tech' | 'guarantee' | 'size'>('size');

  // Hydrate favorites from local storage (guarded for SSR)
  useEffect(() => {
    try {
      const cached = localStorage.getItem('courthub_favorites');
      if (cached) setFavorites(JSON.parse(cached));
    } catch {}
  }, []);

  // Sync favorites changes with local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('courthub_favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  // Reset quantity and options when switching between items
  useEffect(() => {
    setQuantity(1);
    setActiveImage(0);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [product?.id]);

  if (!product) {
    return (
      <div className="bg-sand min-h-screen text-ink flex flex-col items-center justify-center p-6 text-center font-sans md:max-[1519px]:ps-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 max-w-md p-8 bg-white rounded-[32px] border border-ink/5 shadow-2xl"
        >
          <span className="text-[10px] text-[#1E5AE8] font-mono tracking-[0.2em] uppercase font-bold py-1.5 px-3 bg-[#1E5AE8]/10 border border-[#1E5AE8]/20 rounded-full inline-block">
            {t.shop.notFoundBadge}
          </span>
          <h2 className="text-3xl font-display font-black uppercase tracking-tight italic">
            {t.shop.notFoundTitle}
          </h2>
          <p className="text-ink/60 text-sm leading-relaxed">
            {t.shop.notFoundDesc}
          </p>
          <Link
            href={lp('/shop')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E5AE8] hover:bg-ink text-white font-bold uppercase text-[11px] tracking-widest rounded-full transition-all cursor-pointer shadow-md shadow-[#1E5AE8]/20"
          >
            <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
            <span>{t.shop.returnToShop}</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  const isFavorite = favorites.includes(product.id);

  const toggleFavorite = () => {
    setFavorites(prev =>
      prev.includes(product.id)
        ? prev.filter(item => item !== product.id)
        : [...prev, product.id]
    );
    showToast(isFavorite ? t.shop.removedFromSaved : t.shop.addedToSaved);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const addToCart = () => {
    if (!product.inStock) return;
    add(
      {
        id: product.id,
        slug: product.slug,
        title: product.name,
        price_aed: product.price,
        image: product.image,
        max_qty: product.maxQty,
      },
      quantity
    );
    setTimeout(() => openDrawer(), 200);
    showToast(t.shop.addedQtyToBag(quantity, product.name));
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
    }
    setIsCopied(true);
    showToast(t.shop.linkCopied);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const relatedProducts = related;

  // Real specs only, in a fixed readable order, with human labels.
  const SPEC_LABELS: Record<string, string> = {
    head_size: t.shop.specHeadSize,
    weight: t.shop.specWeight,
    grip_size: t.shop.specGripSize,
    balance: t.shop.specBalance,
    year: t.shop.specYear,
  };
  const specsList = Object.keys(SPEC_LABELS)
    .filter((k) => product.specs[k])
    .map((k) => [SPEC_LABELS[k], product.specs[k]] as const);
  const conditionLabel: Record<string, string> = {
    new: t.shop.condNew,
    'like-new': t.shop.condLikeNew,
    good: t.shop.condGood,
    fair: t.shop.condFair,
  };
  const mainImage = product.images[activeImage] ?? product.image;

  // Helper to split the product name for styled stacking
  const nameParts = product.name.split(' ');
  const firstNameWord = nameParts[0] || 'STEALTH';
  const remainingName = nameParts.slice(1).join(' ') || '';

  return (
    // Rail is always-on here; root carries bg-sand, so band-padding it clears
    // the rail with no visible lane (padding area paints the same sand).
    <div className="bg-sand min-h-screen text-ink selection:bg-lime/30 font-sans relative overflow-x-hidden md:max-[1519px]:ps-24">

      {/* Dynamic Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#0E0E0C] text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-semibold text-xs tracking-wider uppercase border border-white/10"
          >
            <Check className="w-5 h-5 text-lime" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area on light sand background */}
      <div className="relative w-full z-10 bg-sand">
        {/* Fine background grid lines - ultra precise & subtle */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(14,14,12,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,14,12,0.015)_1px,transparent_1px)] bg-[size:5rem_5rem] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-8 pb-16 relative z-10">

          {/* Breadcrumb Indicator */}
          <nav className="flex items-center gap-2 text-xs font-sans text-stone-500 font-medium pt-8 pb-4">
            <Link href={lp('/shop')} className="hover:text-ink transition-colors">{t.shop.products}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 rtl:-scale-x-100" />
            <span className="text-stone-400 uppercase tracking-wider text-[10px] font-bold">{product.brand}</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 rtl:-scale-x-100" />
            <span className="text-ink font-bold truncate max-w-[200px] sm:max-w-none">{product.name}</span>
          </nav>

          {/* =======================================================
               MAIN REDESIGNED CONTENT BLOCK (1/1 Screenshot Layout)
             ======================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 py-6 items-start">

            {/* COLUMN 1: LEFT SIDE (Large card + variants thumbnails) */}
            <motion.div
              variants={colLeft(dirSign)}
              initial="hidden"
              animate="show"
              className="lg:col-span-6 space-y-6"
            >

              {/* Wrapper is NOT clipped, so the SALE badge can overhang the top-left corner. */}
              <div className="relative">

                {/* SALE badge — perched on the top-left corner, NO rotation. Hidden on load, then
                    pops in after ~2.4s with a springy entrance and a pulsing blue glow halo behind
                    it (pure CSS, see .ch-badge-pop / .ch-badge-glow in globals.css). */}
                {product.compareAt && (
                <div className="ch-badge-pop absolute -top-6 -start-6 z-20 pointer-events-none">
                  <span aria-hidden className="ch-badge-glow absolute inset-0 rounded-full bg-[#1E5AE8] blur-xl" />
                  <div className="relative w-[76px] h-[76px] bg-[#1E5AE8] rounded-full flex items-center justify-center select-none shadow-[0_8px_24px_rgba(30,90,232,0.45)] ring-1 ring-white/15">
                    <span className="text-[11px] font-sans font-extrabold tracking-[0.25em] text-white uppercase ms-0.5">{t.shop.sale}</span>
                  </div>
                </div>
                )}

                {/* Product Showpiece Container (`isolate` scopes the image's blend to this card). */}
                <div className="relative w-full aspect-[4/5] sm:aspect-square md:aspect-[4/5] bg-white rounded-[32px] overflow-hidden border border-ink/10 shadow-xs flex items-center justify-center p-8 lg:p-12 isolate">

                  {/* Soft floating ground shadow beneath the product — keeps the lifted look without
                      the old rectangular drop-shadow that outlined the image's bounding box. */}
                  <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 w-2/5 h-5 bg-black/15 blur-2xl rounded-[50%] pointer-events-none z-0" />

                  {/* Floating Racket Render — mix-blend-multiply melts the image's white studio
                      background into the white card pixel-for-pixel (white × card = card), so no
                      rectangle shows; the bob keeps the floating effect. */}
                  <div className="absolute inset-x-8 inset-y-12 flex items-center justify-center select-none pointer-events-none z-10">
                    <motion.img
                      key={mainImage}
                      src={mainImage}
                      alt={product.name}
                      animate={{ y: [0, -12, 0] }}
                      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                      className="h-full w-auto max-h-[420px] sm:max-h-[500px] object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer" fetchPriority="high" decoding="async"
                    />
                  </div>

                </div>

              </div>

              {/* Real gallery: one thumbnail per uploaded photo (hidden for a single photo). */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {product.images.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-label={`${product.name} ${i + 1}`}
                      className={`aspect-square rounded-[20px] bg-white p-3 flex items-center justify-center overflow-hidden border-2 transition-all cursor-pointer isolate ${
                        i === activeImage ? 'border-court-blue shadow-sm' : 'border-ink/10 hover:border-ink/30'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-contain mix-blend-multiply" loading="lazy" decoding="async" />
                    </button>
                  ))}
                </div>
              )}

            </motion.div>

            {/* COLUMN 2: RIGHT SIDE (The comprehensive specs, variants, pricing & details) */}
            <motion.div
              variants={colRight}
              initial="hidden"
              animate="show"
              className="lg:col-span-6 space-y-6 lg:ps-4 text-start"
            >

              {/* Category */}
              <span className="text-xs font-sans font-extrabold tracking-[0.2em] text-ink/60 uppercase block">
                {product.brand}
              </span>

              {/* Title */}
              <h1 className="text-3xl sm:text-4.5xl font-display font-black tracking-tight text-ink mt-1.5 leading-none">
                {product.name}
              </h1>

              {/* Price display with excl notation */}
              <div className="flex items-baseline gap-3 pt-3">
                <span className="text-4xl font-sans font-black text-ink tracking-tight">AED {product.price}</span>
                {product.compareAt && (
                  <span className="text-lg font-sans font-bold text-ink/30 line-through">AED {product.compareAt}</span>
                )}
                <span className="text-xs font-sans font-bold text-stone-400 uppercase tracking-widest leading-none">
                  {t.shop.vatNote}
                </span>
              </div>

              {/* Description */}
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-xl">
                {product.desc}
              </p>

              {/* Real attributes from the admin: condition (pre-owned only) and specs. */}
              {(specsList.length > 0 || (product.condition && product.condition !== 'new')) && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-xs font-sans font-bold text-ink uppercase tracking-wider">{t.shop.specsTitle}</h3>
                  <dl className="grid grid-cols-2 gap-2.5">
                    {product.condition && product.condition !== 'new' && (
                      <div className="bg-white/60 rounded-2xl px-4 py-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{t.shop.conditionTitle}</dt>
                        <dd className="text-sm font-bold text-ink">{conditionLabel[product.condition]}</dd>
                      </div>
                    )}
                    {specsList.map(([label, value]) => (
                      <div key={label} className="bg-white/60 rounded-2xl px-4 py-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</dt>
                        <dd className="text-sm font-bold text-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-3 pt-3">
                <h3 className="text-xs font-sans font-bold text-ink uppercase tracking-wider">{t.shop.quantity}</h3>
                <div className="flex items-center">
                  <div className="flex items-center bg-white/60 rounded-full p-1.5 h-11 border border-ink/5">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-base hover:bg-white text-ink/70 hover:text-ink cursor-pointer leading-none transition-all"
                    >
                      -
                    </button>
                    <span className="font-sans font-extrabold text-xs text-ink px-4 w-10 text-center select-none">{quantity}</span>
                    <button
                      onClick={() => setQuantity(prev => Math.min(product.maxQty, prev + 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-base hover:bg-white text-ink/70 hover:text-ink cursor-pointer leading-none transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Massive pill-shaped direct add to cart action */}
              <div className="pt-2">
                <button
                  onClick={addToCart}
                  disabled={!product.inStock}
                  className="w-full py-4.5 bg-ink hover:bg-court-blue text-white hover:text-white font-sans text-xs md:text-[13px] font-extrabold uppercase tracking-[0.2em] rounded-full shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 border border-white/5 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>{product.inStock ? t.shop.addToCart : t.shop.outOfStock}</span>
                </button>
              </div>

              {/* Iconic USPs checkmarks with outline bullet icons */}
              <div className="space-y-3 pt-6 mt-6 border-t border-ink/10 font-sans text-xs font-extrabold tracking-wider text-stone-500 uppercase">

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center text-ink shrink-0">
                    <Truck className="w-3 h-3" />
                  </div>
                  <span>{t.shop.shippedToDoor}</span>
                </div>

              </div>

            </motion.div>

          </div>

          {/* RELATED PRODUCTS */}
          <motion.div
            id="related-specs"
            variants={sectionReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="border-t border-ink/10 pt-16 pb-8 text-start space-y-8 mt-12 scroll-mt-6"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-stone-400 block">{t.shop.experienceMore}</span>
                <h2 className="text-2xl sm:text-3xl lg:text-3.5xl font-display font-black uppercase tracking-tight italic text-ink">
                  {t.shop.recommended}
                </h2>
              </div>
              <Link
                href={lp('/shop')}
                className="text-[10px] font-mono tracking-widest uppercase text-court-blue hover:text-ink transition-colors gap-1.5 flex items-center font-bold"
              >
                <span>{t.shop.allProducts}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
              </Link>
            </div>

            <motion.div
              variants={gridParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {relatedProducts.map((rel) => (
                <motion.div
                  key={rel.id}
                  variants={cardItem}
                  whileHover={{ y: -6 }}
                  className="group bg-white rounded-[20px] p-5 border border-ink/10 hover:border-court-blue/20 transition-colors flex flex-col justify-between shadow-xs hover:shadow-md"
                >
                  <div className="space-y-4">
                    <Link href={lp(`/shop/${rel.slug}`)} className="block relative aspect-square rounded-[12px] bg-sand overflow-hidden">
                      <img
                        src={rel.image}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                        referrerPolicy="no-referrer" loading="lazy" decoding="async"
                      />
                    </Link>

                    <div className="space-y-1 text-start">
                      <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-semibold">{rel.brand}</span>
                      <Link href={lp(`/shop/${rel.slug}`)} className="block">
                        <h4 className="font-display font-black text-sm uppercase tracking-tight text-ink line-clamp-1 group-hover:text-court-blue transition-colors">
                          {rel.name}
                        </h4>
                      </Link>
                      <p className="text-xs text-stone-500 line-clamp-1 h-4">{rel.desc}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-ink/5 flex items-center justify-between">
                    <span className="text-sm font-display font-black text-court-blue">AED {rel.price}</span>
                    <Link
                      href={lp(`/shop/${rel.slug}`)}
                      className="px-3.5 py-1.5 bg-sand/60 group-hover:bg-court-blue text-ink group-hover:text-white text-[8px] font-mono uppercase tracking-widest rounded-full font-bold transition-all"
                    >
                      {t.shop.specsCta}
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* Footer block (site footer) */}
      <Footer />

    </div>
  );
}

// Minimal clean check circle icon
function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className={props.className}
      style={{ width: '20px', height: '20px' }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
