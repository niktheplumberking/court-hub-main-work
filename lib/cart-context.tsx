'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem } from './types';

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
  // Drawer UI state — the cart lives in a global slide-in drawer (no /cart page).
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
// v2: carts are keyed by real database product ids. v1 carts could hold demo-catalog
// items that checkout (correctly) rejects, so they are discarded rather than migrated.
const KEY = 'courthub_cart_v2';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems((JSON.parse(raw) as CartItem[]).filter((i) => UUID.test(i.id)));
      localStorage.removeItem('courthub_cart_v1');
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add: CartCtx['add'] = (item, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found)
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: Math.min(i.qty + qty, i.max_qty) } : i
        );
      return [...prev, { ...item, qty: Math.min(qty, item.max_qty) }];
    });
  };

  const remove = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const setQty = (id: string, qty: number) =>
    setItems((p) =>
      p.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.max_qty)) } : i))
    );
  const clear = () => setItems([]);
  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const { count, total } = useMemo(
    () => ({
      count: items.reduce((a, i) => a + i.qty, 0),
      total: items.reduce((a, i) => a + i.qty * i.price_aed, 0),
    }),
    [items]
  );

  return (
    <Ctx.Provider
      value={{ items, add, remove, setQty, clear, count, total, drawerOpen, openDrawer, closeDrawer }}
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
