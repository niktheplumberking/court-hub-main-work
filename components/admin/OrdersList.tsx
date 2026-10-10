'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { formatAED } from '@/lib/utils';
import type { Order } from '@/lib/types';
import OrderStatusSelect from '@/components/admin/OrderStatusSelect';

type Filter = 'all' | 'paid' | 'fulfilled' | 'cancelled';

const TABS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'To ship' },
  { id: 'fulfilled', label: 'Fulfilled' },
  { id: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 30;

// Stripe stores the delivery address as { name, address: { line1, line2, city, state, postal_code, country } }.
// Rendered defensively: older orders or odd shapes simply show no address instead of crashing the page.
function formatShipping(raw: unknown): { name: string | null; lines: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as { name?: string; address?: Record<string, string | null> };
  const a = s.address;
  if (!a) return null;
  const lines = [a.line1, a.line2, a.city, a.state, a.postal_code, a.country].filter(Boolean).join(', ');
  return lines ? { name: s.name ?? null, lines } : null;
}

/**
 * Orders list with status tabs, live search and "show more". Cancelled and
 * fulfilled orders are never deleted (they are the accounting record); the
 * tabs keep the working view focused on what still needs shipping.
 */
export default function OrdersList({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<Filter>('paid');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: orders.length, paid: 0, fulfilled: 0, cancelled: 0 };
    for (const o of orders) if (o.status in c) c[o.status as Filter] += 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false;
      if (!q) return true;
      const haystack = [
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.id.slice(0, 8),
        ...o.items.map((i) => i.title),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, filter, query]);

  const shown = filtered.slice(0, visible);
  const select = (f: Filter) => {
    setFilter(f);
    setVisible(PAGE_SIZE);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter orders by status">
          {TABS.map((t) => {
            const active = filter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => select(t.id)}
                className={`px-4 py-2 rounded-full border text-sm transition-colors cursor-pointer ${
                  active
                    ? 'bg-lime text-ink border-lime font-bold'
                    : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                }`}
              >
                {t.label} <span className={active ? 'opacity-70' : 'text-white/35'}>{counts[t.id]}</span>
              </button>
            );
          })}
        </div>
        <div className="relative md:ms-auto md:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Search name, email, phone, product…"
            aria-label="Search orders"
            className="adm-input adm-input-icon w-full"
          />
        </div>
      </div>

      <div className="space-y-3">
        {shown.map((o) => {
          const ship = formatShipping(o.shipping);
          return (
            <div key={o.id} className="adm-card p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">
                  {o.customer_name ?? 'Customer'}{' '}
                  <span className="text-white/30 text-sm">· {o.customer_email}</span>
                </p>
                <p className="text-white/50 text-sm mt-1">
                  {o.items.map((i) => `${i.title} ×${i.qty}`).join(' · ')}
                </p>
                {ship && (
                  <p className="text-white/70 text-sm mt-2">
                    <span className="text-white/40 text-xs uppercase tracking-wider me-2">Deliver to</span>
                    {ship.name ? `${ship.name} · ` : ''}
                    {ship.lines}
                  </p>
                )}
                <p className="text-white/35 font-mono text-xs mt-2">
                  <span className="text-lime/60">#</span>
                  {o.id.slice(0, 8).toUpperCase()} · {new Date(o.created_at).toLocaleString('en-AE')}{' '}
                  {o.customer_phone ? `· ${o.customer_phone}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white font-display font-bold text-lg">{formatAED(o.amount_aed)}</span>
                <OrderStatusSelect key={`${o.id}-${o.status}`} id={o.id} status={o.status} />
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="adm-card text-white/40 py-16 text-center">
            {orders.length === 0
              ? "No orders yet. They'll appear here the moment Stripe confirms a payment."
              : filter === 'paid' && !query
                ? 'Nothing waiting to ship. Nice work.'
                : 'No orders match this filter or search.'}
          </p>
        )}

        {filtered.length > visible && (
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="w-full py-3 rounded-full border border-white/15 text-white/60 text-sm hover:border-lime hover:text-lime transition-colors cursor-pointer"
          >
            Show more ({filtered.length - visible} remaining)
          </button>
        )}
      </div>
    </div>
  );
}
