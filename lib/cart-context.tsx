'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CartItem } from './types';

export type CartNotice = 'cancelled' | 'bagUpdated' | null;

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
  /** Items that can't be bought right now (sold out / removed from the shop). */
  hasUnavailable: boolean;
  /** Re-checks stock + prices with the server. Resolves true if anything changed. */
  refresh: () => Promise<boolean>;
  /** Stock reservation of the shopper's latest unpaid Stripe checkout. */
  pendingHold: string | null;
  setPendingHold: (hold: string | null) => void;
  notice: CartNotice;
  setNotice: (n: CartNotice) => void;
  // Drawer UI state — the cart lives in a global slide-in drawer (no /cart page).
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
// v2: carts are keyed by real database product ids. v1 carts could hold demo-catalog
// items that checkout (correctly) rejects, so they are discarded rather than migrated.
const KEY = 'courthub_cart_v2';
const HOLD_KEY = 'courthub_pending_hold';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LiveItem = { id: string; maxQty: number; title?: string; slug?: string; price_aed?: number; image?: string | null };

function readHold(): string | null {
  try {
    const h = localStorage.getItem(HOLD_KEY);
    return h && UUID.test(h) ? h : null;
  } catch {
    return null;
  }
}

function writeHold(h: string | null) {
  try {
    if (h) localStorage.setItem(HOLD_KEY, h);
    else localStorage.removeItem(HOLD_KEY);
  } catch {}
}

/** Gives the stock of an abandoned checkout back right away (fire-and-forget). */
function releaseHold(hold: string) {
  try {
    void fetch('/api/checkout/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hold }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingHold, setPendingHoldState] = useState<string | null>(null);
  const [notice, setNotice] = useState<CartNotice>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const setPendingHold = useCallback((h: string | null) => {
    writeHold(h);
    setPendingHoldState(h);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems((JSON.parse(raw) as CartItem[]).filter((i) => UUID.test(i.id)));
      localStorage.removeItem('courthub_cart_v1');
    } catch {}
    const hold = readHold();

    // Back from Stripe via its "←" link (cancel_url adds ?checkout=cancelled):
    // free the reserved stock now and reopen the bag where they left it.
    const url = new URL(window.location.href);
    if (url.searchParams.get('checkout') === 'cancelled') {
      if (hold) releaseHold(hold);
      writeHold(null);
      setNotice('cancelled');
      setDrawerOpen(true);
      url.searchParams.delete('checkout');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    } else {
      setPendingHoldState(hold);
    }
    setHydrated(true);
  }, []);

  // Browser Back from the Stripe page restores this page from the bfcache
  // (no reload, no effects re-run) — treat that as "didn't pay" too.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      const hold = readHold();
      if (hold) {
        releaseHold(hold);
        writeHold(null);
        setPendingHoldState(null);
      }
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const add: CartCtx['add'] = (item, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found)
        return prev.map((i) =>
          // Freshest stock limit wins (the page that added it just rendered it).
          i.id === item.id
            ? { ...i, ...item, qty: Math.min(i.qty + qty, item.max_qty), unavailable: false }
            : i
        );
      return [...prev, { ...item, qty: Math.min(qty, item.max_qty) }];
    });
  };

  const remove = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const setQty = (id: string, qty: number) =>
    setItems((p) =>
      p.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.max_qty)) } : i))
    );
  const clear = useCallback(() => {
    setItems([]);
    writeHold(null);
    setPendingHoldState(null);
  }, []);
  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const refresh = useCallback(async () => {
    const current = itemsRef.current;
    if (!current.length) return false;
    let live: LiveItem[];
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: current.map((i) => i.id), hold: readHold() }),
        cache: 'no-store',
      });
      if (!res.ok) return false;
      live = ((await res.json()) as { items: LiveItem[] }).items;
    } catch {
      return false; // offline / server hiccup: keep the bag as is, checkout re-validates anyway
    }

    const apply = (i: CartItem): CartItem => {
      const l = live.find((x) => x.id === i.id);
      if (!l) return i;
      if (l.maxQty <= 0) return i.unavailable ? i : { ...i, unavailable: true };
      return {
        ...i,
        title: l.title ?? i.title,
        slug: l.slug ?? i.slug,
        image: l.image ?? i.image,
        price_aed: l.price_aed ?? i.price_aed,
        max_qty: l.maxQty,
        qty: Math.min(i.qty, l.maxQty),
        unavailable: false,
      };
    };
    // Shopper-visible change = price, quantity or availability moved.
    const changed = itemsRef.current.some((i) => {
      const n = apply(i);
      return n.price_aed !== i.price_aed || n.qty !== i.qty || Boolean(n.unavailable) !== Boolean(i.unavailable);
    });
    setItems((prev) => prev.map(apply));
    return changed;
  }, []);

  const { count, total, hasUnavailable } = useMemo(() => {
    const buyable = items.filter((i) => !i.unavailable);
    return {
      count: items.reduce((a, i) => a + i.qty, 0),
      total: buyable.reduce((a, i) => a + i.qty * i.price_aed, 0),
      hasUnavailable: buyable.length !== items.length,
    };
  }, [items]);

  return (
    <Ctx.Provider
      value={{
        items,
        add,
        remove,
        setQty,
        clear,
        count,
        total,
        hasUnavailable,
        refresh,
        pendingHold,
        setPendingHold,
        notice,
        setNotice,
        drawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
