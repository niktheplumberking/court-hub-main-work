'use client';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatAED } from '@/lib/utils';
import { waHref } from '@/lib/whatsapp';
import { useDirSign, useLocalePath, useT } from '@/lib/i18n/LocaleProvider';
import { stripLocale } from '@/lib/i18n/locale';

// WhatsApp glyph (brand mark) for the floating contact button.
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
    </svg>
  );
}

// Drawer slide easing — a weighted ease-out that reads like a soft spring.
// Driven by inline styles (not Tailwind translate utilities) so the transform
// can't depend on JIT class generation, which proved flaky during dev HMR.
const SLIDE_TRANSITION = 'transform 420ms cubic-bezier(0.32,0.72,0,1)';

/**
 * Global live cart — a floating bag button (bottom-right, everywhere) plus a
 * slide-in side drawer. Replaces the old /cart page entirely. Mounted once in
 * the root layout, so it's reachable from the home page and every swipe page.
 * Callers open the drawer explicitly via `openDrawer()`; `add()` only mutates
 * items (see cart-context) so adding never force-opens the drawer.
 *
 * Open/close is driven by plain CSS transitions on a permanently-mounted
 * element (translate-x toggled by `drawerOpen`) rather than Framer
 * AnimatePresence — AnimatePresence ran the exit here but never unmounted the
 * node, leaving the drawer stuck in the DOM. CSS transforms are bulletproof.
 */
export default function CartDrawer() {
  const { items, count, total, setQty, remove, drawerOpen, openDrawer, closeDrawer } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useT();
  const lp = useLocalePath();
  const sign = useDirSign();
  const tab = drawerOpen ? 0 : -1;
  // The floating widget is the cart bag ONLY in the shop (where you add items);
  // everywhere else it's a WhatsApp contact button (the primary lead channel).
  const path = stripLocale(usePathname());
  const isShopArea = path === '/shop' || path.startsWith('/shop/');

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  const checkout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((i) => ({ id: i.id, qty: i.qty })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.cart.checkoutError);
      window.location.href = data.url;
    } catch (e: unknown) {
      // Checkout is intentionally deferred until Stripe keys exist; fail soft.
      setError(e instanceof Error ? e.message : t.cart.checkoutError);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating widget — cart bag in the shop, WhatsApp elsewhere. Fades/shrinks
          away while the cart drawer is open (only reachable on shop pages). */}
      <div
        style={{
          transform: drawerOpen ? 'scale(0)' : 'scale(1)',
          opacity: drawerOpen ? 0 : 1,
          transition: 'transform 300ms ease-out, opacity 300ms ease-out',
        }}
        className={`fixed bottom-7 end-6 md:bottom-8 md:end-8 z-[60] ${
          drawerOpen ? 'pointer-events-none' : ''
        }`}
      >
        {isShopArea ? (
          <button
            id="cart-fab"
            onClick={openDrawer}
            aria-label={t.cart.openCart(count)}
            className="relative p-4 bg-lime hover:bg-white text-ink rounded-full shadow-2xl flex items-center justify-center cursor-pointer group border border-white/10 transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-ink group-hover:scale-110 transition-transform" />
            {count > 0 && (
              <motion.span
                key={count}
                animate={{ scale: [1.4, 0.9, 1] }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                className="absolute -top-1.5 -end-1.5 bg-court-blue text-white text-[10px] font-mono font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center shadow-lg border border-white/10"
              >
                {count}
              </motion.span>
            )}
          </button>
        ) : (
          <a
            href={waHref(t.cart.waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.cart.whatsappAria}
            className="p-4 bg-[#25D366] hover:bg-[#1ebe5b] text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer group border border-white/10 transition-colors"
          >
            <WhatsAppGlyph className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </a>
        )}
      </div>

      {/* Backdrop — fades in/out; non-interactive when the drawer is closed. */}
      <div
        onClick={closeDrawer}
        aria-hidden
        style={{ opacity: drawerOpen ? 1 : 0, transition: 'opacity 300ms ease' }}
        className={`fixed inset-0 bg-black/60 z-[10000] ${
          drawerOpen ? 'cursor-pointer' : 'pointer-events-none'
        }`}
      />

      {/* Drawer — always mounted, slid off-screen when closed (inline transform). */}
      <aside
        role="dialog"
        aria-label={t.cart.dialogLabel}
        aria-hidden={!drawerOpen}
        style={{
          // 105% (not 100%) so the panel — and its faint border hairline —
          // fully clears the scrollbar gutter when closed; no edge sliver peeks.
          // Slides from the inline-end: +x in LTR, -x in RTL.
          transform: drawerOpen ? 'translateX(0)' : `translateX(${105 * sign}%)`,
          transition: SLIDE_TRANSITION,
        }}
        // Above the mobile header wrapper (z-[9999]) — the open cart must cover
        // every nav surface; only the preloader and custom cursor sit higher.
        className={`fixed top-0 end-0 bottom-0 w-full max-w-md bg-ink-2 z-[10010] border-s border-white/10 shadow-2xl flex flex-col ${
          drawerOpen ? '' : 'pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-lime" />
            <h2 className="text-lg font-display font-bold uppercase tracking-wider text-white">
              {t.cart.yourBag(count)}
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            aria-label={t.cart.closeCart}
            tabIndex={tab}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-6 bg-white/5 rounded-full border border-white/10 text-white/30">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <div>
                <p className="font-display font-bold uppercase tracking-wider text-sm text-white">
                  {t.cart.emptyTitle}
                </p>
                <p className="text-white/40 text-[11px] font-mono uppercase tracking-widest mt-1">
                  {t.cart.emptySub}
                </p>
              </div>
              <Link
                href={lp('/shop')}
                onClick={closeDrawer}
                tabIndex={tab}
                className="inline-block mt-2 px-7 py-3 rounded-full bg-lime text-ink font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-[filter,transform] duration-200"
              >
                {t.cart.browseShop}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((i) => (
                <div
                  key={i.id}
                  className="flex gap-4 p-4 bg-ink rounded-[20px] border border-white/5 items-center overflow-hidden"
                >
                  {/* Thumbnail */}
                  <Link
                    href={lp(`/shop/${i.slug}`)}
                    onClick={closeDrawer}
                    tabIndex={tab}
                    className="w-16 h-16 bg-black/40 rounded-[12px] flex items-center justify-center p-2.5 shrink-0 border border-white/5"
                  >
                    {i.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={i.image}
                        alt={i.title}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer" loading="lazy" decoding="async"
                      />
                    ) : null}
                  </Link>

                  {/* Name + qty */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <Link
                      href={lp(`/shop/${i.slug}`)}
                      onClick={closeDrawer}
                      tabIndex={tab}
                      className="block truncate text-sm font-display font-bold leading-tight text-white hover:text-lime transition-colors"
                    >
                      {i.title}
                    </Link>
                    <div className="flex items-center gap-1.5 bg-white/5 rounded-[12px] p-1 w-fit border border-white/5">
                      <button
                        onClick={() => setQty(i.id, i.qty - 1)}
                        aria-label={t.cart.decreaseQty}
                        tabIndex={tab}
                        className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white cursor-pointer transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono text-xs text-white w-7 text-center">{i.qty}</span>
                      <button
                        onClick={() => setQty(i.id, i.qty + 1)}
                        aria-label={t.cart.increaseQty}
                        tabIndex={tab}
                        className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Price + remove */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className="font-display font-black text-lime text-sm whitespace-nowrap">
                      {formatAED(i.price_aed * i.qty)}
                    </span>
                    <button
                      onClick={() => remove(i.id)}
                      aria-label={t.cart.removeItem(i.title)}
                      tabIndex={tab}
                      className="text-white/30 hover:text-fire cursor-pointer transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-ink space-y-5 shrink-0">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs font-mono text-white/50 tracking-wider">
                <span className="uppercase">{t.cart.subtotal}</span>
                <span>{formatAED(total)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono text-white/50 tracking-wider">
                <span className="uppercase">{t.cart.shippingLabel}</span>
                <span className="text-lime uppercase">{t.cart.freeShipping}</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between items-end">
                <span className="text-xs font-semibold uppercase tracking-widest font-mono text-white">
                  {t.cart.total}
                </span>
                <span className="text-3xl font-display font-black text-lime">{formatAED(total)}</span>
              </div>
            </div>

            {error && <p className="text-fire text-xs text-center">{error}</p>}

            <button
              onClick={checkout}
              disabled={loading}
              tabIndex={tab}
              className="w-full py-4 bg-lime hover:bg-white text-ink font-display font-black uppercase tracking-[0.16em] rounded-full shadow-xl transition-colors duration-300 cursor-pointer text-xs flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? t.cart.redirecting : t.cart.proceed}
            </button>
            <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest text-center">
              {t.cart.securePayment}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
