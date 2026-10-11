'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { Search, Download, ChevronDown, Copy, Check, ExternalLink, Phone, Mail, Truck } from 'lucide-react';
import { formatAED } from '@/lib/utils';
import type { Order } from '@/lib/types';
import OrderStatusSelect from '@/components/admin/OrderStatusSelect';
import { updateOrderStatus } from '@/lib/actions/products';

type Filter = 'all' | 'paid' | 'fulfilled' | 'cancelled';
type Range = 'all' | 'today' | '7d' | '30d';
type Sort = 'newest' | 'oldest' | 'amount';
type View = 'orders' | 'products';

const TABS: { id: Filter; label: string }[] = [
  { id: 'paid', label: 'To ship' },
  { id: 'fulfilled', label: 'Shipped' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' },
];

const RANGES: { id: Range; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
];

const PAGE_SIZE = 30;
const DAY = 86_400_000;
// A paid order waiting longer than this gets an amber "waiting" flag.
const LATE_AFTER_DAYS = 2;

// Stripe stores the delivery address as { name, address: { line1, line2, city, state, postal_code, country } }.
// Rendered defensively: older orders or odd shapes simply show no address instead of crashing the page.
function formatShipping(raw: unknown): { name: string | null; lines: string[] } | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as { name?: string; address?: Record<string, string | null> };
  const a = s.address;
  if (!a) return null;
  // UAE addresses often carry the emirate as both city and state ("Dubai, Dubai").
  const area = a.state && a.state.trim().toLowerCase() !== (a.city ?? '').trim().toLowerCase() ? [a.city, a.state] : [a.city];
  const lines = [a.line1, a.line2, area.filter(Boolean).join(', '), a.postal_code, a.country === 'AE' ? 'United Arab Emirates' : a.country]
    .filter((x): x is string => Boolean(x && x.trim()));
  return lines.length ? { name: s.name ?? null, lines } : null;
}

// Fixed to UAE time so the server (UTC) and the admin's browser render the same text.
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-AE', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' });

const shortId = (o: Order) => o.id.slice(0, 8).toUpperCase();
const units = (o: Order) => o.items.reduce((s, i) => s + i.qty, 0);

function rangeStart(r: Range, now: number): number {
  if (r === 'today') {
    // Midnight in Dubai (UTC+4, no DST).
    const dubai = now + 4 * 3_600_000;
    return dubai - (dubai % DAY) - 4 * 3_600_000;
  }
  if (r === '7d') return now - 7 * DAY;
  if (r === '30d') return now - 30 * DAY;
  return 0;
}

function csvCell(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(orders: Order[]) {
  const head = ['Order', 'Date', 'Status', 'Customer', 'Email', 'Phone', 'Deliver to', 'Items', 'Units', 'Total (AED)'];
  const rows = orders.map((o) => {
    const ship = formatShipping(o.shipping);
    return [
      shortId(o),
      fmtDate(o.created_at),
      o.status === 'paid' ? 'To ship' : o.status === 'fulfilled' ? 'Shipped' : 'Cancelled',
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      ship ? ship.lines.join(', ') : '',
      o.items.map((i) => `${i.title} x${i.qty}`).join('; '),
      units(o),
      Number(o.amount_aed).toFixed(2),
    ];
  });
  // BOM so Excel opens Arabic names / special characters correctly.
  const csv = '﻿' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `courthub-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Orders workspace: stats for the chosen period, status tabs, date range,
 * sort, search, CSV export, a "Products sold" tally, and expandable order
 * details (full address, contact links, Stripe payment link).
 * Cancelled and shipped orders are never deleted — they are the sales record.
 */
export default function OrdersList({ orders, stripeLive }: { orders: Order[]; stripeLive: boolean }) {
  const [filter, setFilter] = useState<Filter>('paid');
  const [range, setRange] = useState<Range>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [view, setView] = useState<View>('orders');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [open, setOpen] = useState<string | null>(null);
  // Time-dependent UI (age flags, date ranges) waits for the browser clock so
  // server and client HTML match on first render.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  // Everything inside the chosen date range (tabs + stats work on this).
  const inRange = useMemo(() => {
    const from = now ? rangeStart(range, now) : 0;
    return from ? orders.filter((o) => new Date(o.created_at).getTime() >= from) : orders;
  }, [orders, range, now]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: inRange.length, paid: 0, fulfilled: 0, cancelled: 0 };
    for (const o of inRange) if (o.status in c) c[o.status as Filter] += 1;
    return c;
  }, [inRange]);

  const stats = useMemo(() => {
    const sold = inRange.filter((o) => o.status !== 'cancelled');
    const revenue = sold.reduce((s, o) => s + Number(o.amount_aed), 0);
    const toShip = inRange.filter((o) => o.status === 'paid');
    return {
      revenue,
      orders: sold.length,
      avg: sold.length ? revenue / sold.length : 0,
      toShip: toShip.length,
      toShipUnits: toShip.reduce((s, o) => s + units(o), 0),
      late: now ? toShip.filter((o) => now - new Date(o.created_at).getTime() > LATE_AFTER_DAYS * DAY).length : 0,
    };
  }, [inRange, now]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = inRange.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false;
      if (!q) return true;
      const ship = formatShipping(o.shipping);
      const haystack = [
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.id.slice(0, 8),
        ship?.lines.join(' '),
        ...o.items.map((i) => i.title),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
    const time = (o: Order) => new Date(o.created_at).getTime();
    if (sort === 'oldest') list.sort((a, b) => time(a) - time(b));
    else if (sort === 'amount') list.sort((a, b) => Number(b.amount_aed) - Number(a.amount_aed));
    else list.sort((a, b) => time(b) - time(a));
    return list;
  }, [inRange, filter, query, sort]);

  // "Products sold": units per product across the filtered orders (never cancelled ones).
  const products = useMemo(() => {
    const map = new Map<string, { title: string; units: number; revenue: number; toShip: number; orders: number }>();
    for (const o of filtered) {
      if (o.status === 'cancelled') continue;
      for (const i of o.items) {
        const key = i.id || i.title;
        const row = map.get(key) ?? { title: i.title, units: 0, revenue: 0, toShip: 0, orders: 0 };
        row.units += i.qty;
        row.revenue += Number(i.price_aed) * i.qty;
        row.orders += 1;
        if (o.status === 'paid') row.toShip += i.qty;
        map.set(key, row);
      }
    }
    return [...map.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue);
  }, [filtered]);

  const shown = filtered.slice(0, visible);
  const reset = () => setVisible(PAGE_SIZE);

  const selectCls = 'adm-input w-auto! rounded-full! px-4! py-2! text-sm cursor-pointer';

  return (
    <div className="space-y-5">
      {/* ── Stats for the chosen period ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="To ship" value={String(stats.toShip)} sub={`${stats.toShipUnits} item${stats.toShipUnits === 1 ? '' : 's'} to pack`} />
        <Stat
          label="Waiting 2+ days"
          value={String(stats.late)}
          sub={stats.late ? 'Ship these first' : 'All on time'}
          warn={stats.late > 0}
        />
        <Stat label="Revenue" value={formatAED(stats.revenue)} sub={`${stats.orders} order${stats.orders === 1 ? '' : 's'}, excl. cancelled`} />
        <Stat label="Average order" value={formatAED(stats.avg)} sub={RANGES.find((r) => r.id === range)?.label ?? ''} />
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter orders by status">
          {TABS.map((t) => {
            const active = filter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setFilter(t.id);
                  reset();
                }}
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
        <div className="flex flex-wrap items-center gap-2 xl:ms-auto">
          <select
            value={range}
            onChange={(e) => {
              setRange(e.target.value as Range);
              reset();
            }}
            aria-label="Date range"
            className={selectCls}
          >
            {RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort orders" className={selectCls}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount">Highest amount</option>
          </select>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                reset();
              }}
              placeholder="Name, phone, product, area…"
              aria-label="Search orders"
              className="adm-input adm-input-icon w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-white/15 p-1" role="tablist" aria-label="View">
          {(['orders', 'products'] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
                view === v ? 'bg-white/10 text-white font-bold' : 'text-white/50 hover:text-white'
              }`}
            >
              {v === 'orders' ? `Orders (${filtered.length})` : `Products sold (${products.length})`}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => downloadCsv(filtered)}
          disabled={!filtered.length}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/60 text-sm hover:border-lime hover:text-lime transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* ── Products sold ── */}
      {view === 'products' && (
        <div className="adm-card overflow-x-auto">
          {products.length === 0 ? (
            <p className="text-white/40 py-16 text-center">No products sold in this view.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-xs uppercase tracking-wider text-start">
                  <th className="text-start font-normal px-5 py-3">Product</th>
                  <th className="text-end font-normal px-5 py-3">Units sold</th>
                  <th className="text-end font-normal px-5 py-3">Still to ship</th>
                  <th className="text-end font-normal px-5 py-3">Orders</th>
                  <th className="text-end font-normal px-5 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.title} className="border-t border-white/5">
                    <td className="px-5 py-3 text-white">{p.title}</td>
                    <td className="px-5 py-3 text-end text-white font-bold">{p.units}</td>
                    <td className={`px-5 py-3 text-end ${p.toShip ? 'text-white' : 'text-white/30'}`}>{p.toShip}</td>
                    <td className="px-5 py-3 text-end text-white/60">{p.orders}</td>
                    <td className="px-5 py-3 text-end text-white/80">{formatAED(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Orders ── */}
      {view === 'orders' && (
        <div className="space-y-3">
          {shown.map((o) => (
            <OrderCard
              key={o.id}
              o={o}
              stripeLive={stripeLive}
              now={now}
              expanded={open === o.id}
              onToggle={() => setOpen(open === o.id ? null : o.id)}
            />
          ))}

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
      )}
    </div>
  );
}

function Stat({ label, value, sub, warn }: { label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div className={`adm-card p-4 ${warn ? 'border-amber-500/40!' : ''}`}>
      <p className="text-white/40 text-[11px] uppercase tracking-wider">{label}</p>
      <p className={`font-display font-bold text-2xl mt-1 ${warn ? 'text-amber-500' : 'text-white'}`}>{value}</p>
      <p className="text-white/40 text-xs mt-1 truncate">{sub}</p>
    </div>
  );
}

function OrderCard({
  o,
  stripeLive,
  now,
  expanded,
  onToggle,
}: {
  o: Order;
  stripeLive: boolean;
  now: number | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const ship = formatShipping(o.shipping);
  const ageDays = now ? Math.floor((now - new Date(o.created_at).getTime()) / DAY) : 0;
  const late = o.status === 'paid' && ageDays >= LATE_AFTER_DAYS;
  // Charged amount should equal the items' total; anything else needs a look.
  const itemsTotal = o.items.reduce((s, i) => s + Number(i.price_aed) * i.qty, 0);
  const mismatch = o.items.length > 0 && Math.abs(itemsTotal - Number(o.amount_aed)) > 0.01;
  const phoneDigits = (o.customer_phone ?? '').replace(/\D/g, '');
  const stripeUrl = o.stripe_payment_intent
    ? `https://dashboard.stripe.com/${stripeLive ? '' : 'test/'}payments/${o.stripe_payment_intent}`
    : null;

  const copyAddress = async () => {
    if (!ship) return;
    const text = [ship.name ?? o.customer_name, o.customer_phone, ...ship.lines].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className={`adm-card p-5 ${late ? 'border-amber-500/40!' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex-1 min-w-0 text-start cursor-pointer group">
          <p className="text-white font-medium flex items-center gap-2 flex-wrap">
            {o.customer_name ?? 'Customer'}
            <span className="text-white/30 text-sm font-normal">· {o.customer_email}</span>
            {late && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 border border-amber-500/40 rounded-full px-2 py-0.5">
                Waiting {ageDays} days
              </span>
            )}
            {mismatch && (
              <span
                title={`Items add up to ${formatAED(itemsTotal)} but ${formatAED(Number(o.amount_aed))} was charged. Check this payment in Stripe before shipping.`}
                className="text-[10px] font-mono uppercase tracking-wider text-fire border border-fire/40 rounded-full px-2 py-0.5"
              >
                Check amount
              </span>
            )}
          </p>
          <p className="text-white/50 text-sm mt-1">{o.items.map((i) => `${i.title} ×${i.qty}`).join(' · ')}</p>
          {ship && (
            <p className="text-white/70 text-sm mt-2 truncate">
              <span className="text-white/40 text-xs uppercase tracking-wider me-2">Deliver to</span>
              {ship.lines.join(', ')}
            </p>
          )}
          <p className="text-white/35 font-mono text-xs mt-2 flex items-center gap-1">
            <span className="text-lime/60">#</span>
            {shortId(o)} · {fmtDate(o.created_at)}
            <ChevronDown className={`h-3.5 w-3.5 ms-1 transition-transform group-hover:text-white ${expanded ? 'rotate-180' : ''}`} />
            <span className="group-hover:text-white">{expanded ? 'Hide details' : 'Details'}</span>
          </p>
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-white font-display font-bold text-lg">{formatAED(o.amount_aed)}</span>
          {o.status === 'paid' && (
            <button
              type="button"
              disabled={pending}
              onClick={() => start(() => updateOrderStatus(o.id, 'fulfilled'))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime text-ink text-sm font-bold hover:brightness-110 transition cursor-pointer disabled:opacity-50"
            >
              <Truck className="h-4 w-4" /> {pending ? 'Saving…' : 'Mark shipped'}
            </button>
          )}
          <OrderStatusSelect key={`${o.id}-${o.status}`} id={o.id} status={o.status} />
        </div>
      </div>

      {expanded && (
        <div className="mt-5 pt-5 border-t border-white/10 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Items</p>
            <table className="w-full text-sm">
              <tbody>
                {o.items.map((i, idx) => (
                  <tr key={idx} className="border-b border-white/5 last:border-0">
                    <td className="py-2 text-white">{i.title}</td>
                    <td className="py-2 text-white/50 text-end whitespace-nowrap">
                      {i.qty} × {formatAED(Number(i.price_aed))}
                    </td>
                    <td className="py-2 text-white text-end whitespace-nowrap ps-4">{formatAED(Number(i.price_aed) * i.qty)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-3 text-white/40 text-xs uppercase tracking-wider">Charged</td>
                  <td />
                  <td className="pt-3 text-white font-bold text-end">{formatAED(o.amount_aed)}</td>
                </tr>
              </tbody>
            </table>
            {o.status === 'cancelled' && (
              <p className="text-white/40 text-xs mt-3">
                {o.restocked ? 'Items were put back in stock.' : 'Items were not put back in stock automatically (older order).'}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Deliver to</p>
              {ship ? (
                <div className="flex items-start justify-between gap-3">
                  <p className="text-white text-sm leading-relaxed">
                    {ship.name && <span className="font-medium">{ship.name}<br /></span>}
                    {ship.lines.map((l, i) => (
                      <span key={i}>
                        {l}
                        <br />
                      </span>
                    ))}
                  </p>
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-white/60 text-xs hover:border-lime hover:text-lime transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy for courier'}
                  </button>
                </div>
              ) : (
                <p className="text-white/40 text-sm">No address on this order.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {phoneDigits && (
                <>
                  <a
                    href={`https://wa.me/${phoneDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-white/70 text-xs hover:border-lime hover:text-lime transition-colors"
                  >
                    WhatsApp {o.customer_phone}
                  </a>
                  <a
                    href={`tel:+${phoneDigits}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-white/70 text-xs hover:border-lime hover:text-lime transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call
                  </a>
                </>
              )}
              {o.customer_email && (
                <a
                  href={`mailto:${o.customer_email}?subject=${encodeURIComponent(`Your Court Hub order #${shortId(o)}`)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-white/70 text-xs hover:border-lime hover:text-lime transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </a>
              )}
              {stripeUrl && (
                <a
                  href={stripeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-white/70 text-xs hover:border-lime hover:text-lime transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Payment in Stripe (refunds)
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
