import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { formatAED } from '@/lib/utils';
import {
  Package,
  ShoppingBag,
  PenLine,
  ArrowUpRight,
  Plus,
  Store,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type RecentOrder = {
  id: string;
  amount_aed: number;
  status: string;
  created_at: string;
};

export default async function AdminDashboard() {
  let productCount: number | null = null;
  let orderCount: number | null = null;
  let contentEditedCount: number | null = null;
  let recentOrders: RecentOrder[] = [];

  try {
    const supabase = await supabaseServer();
    const [products, orders, recent, content] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase
        .from('orders')
        .select('id, amount_aed, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('site_content').select('key', { count: 'exact', head: true }),
    ]);
    productCount = products.count ?? null;
    orderCount = orders.count ?? null;
    contentEditedCount = content.count ?? null;
    recentOrders = (recent.data as RecentOrder[] | null) ?? [];
  } catch {
    // DB unreachable — render dashes, never crash.
  }

  const today = new Date().toLocaleDateString('en-AE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const dash = (n: number | null) => (n === null ? '—' : n);

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="adm-fade-up">
        <p className="adm-eyebrow">/// COMMAND DECK</p>
        <h1 className="mt-3 font-display font-black uppercase italic text-4xl md:text-5xl text-white">
          Welcome <span className="text-lime">back</span>
        </h1>
        <p className="mt-2 text-white/40 text-sm">{today}</p>
      </header>

      {/* Stat tiles */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/admin/products"
          className="adm-card adm-card-lift adm-fade-up p-6 block group"
          style={{ '--adm-delay': '0.06s' } as React.CSSProperties}
        >
          <div className="flex items-start justify-between">
            <Package className="w-5 h-5 text-lime" />
            <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-lime transition-colors" />
          </div>
          <p className="mt-5 font-display font-black text-4xl text-white">{dash(productCount)}</p>
          <p className="mt-1 text-white/50 text-sm">Products</p>
          <p className="mt-3 text-xs text-white/35 group-hover:text-white/60 transition-colors">
            Manage inventory
          </p>
        </Link>

        <Link
          href="/admin/orders"
          className="adm-card adm-card-lift adm-fade-up p-6 block group"
          style={{ '--adm-delay': '0.12s' } as React.CSSProperties}
        >
          <div className="flex items-start justify-between">
            <ShoppingBag className="w-5 h-5 text-lime" />
            <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-lime transition-colors" />
          </div>
          <p className="mt-5 font-display font-black text-4xl text-white">{dash(orderCount)}</p>
          <p className="mt-1 text-white/50 text-sm">Orders</p>
          <p className="mt-3 text-xs text-white/35 group-hover:text-white/60 transition-colors">
            Track fulfilment
          </p>
        </Link>

        <Link
          href="/admin/content"
          className="adm-card adm-card-lift adm-fade-up p-6 block group"
          style={{ '--adm-delay': '0.18s' } as React.CSSProperties}
        >
          <div className="flex items-start justify-between">
            <PenLine className="w-5 h-5 text-lime" />
            <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-lime transition-colors" />
          </div>
          <p className="mt-5 font-display font-black text-4xl text-white">227</p>
          <p className="mt-1 text-white/50 text-sm">Editable fields</p>
          <p className="mt-3 text-xs text-white/35 group-hover:text-white/60 transition-colors">
            {contentEditedCount === null ? '—' : contentEditedCount} edited · open Content Studio
          </p>
        </Link>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="adm-card adm-card-lift adm-fade-up p-6 block group"
          style={{ '--adm-delay': '0.24s' } as React.CSSProperties}
        >
          <div className="flex items-start justify-between">
            <Store className="w-5 h-5 text-lime" />
            <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-lime transition-colors" />
          </div>
          <p className="mt-5 font-display font-black text-4xl text-white">↗</p>
          <p className="mt-1 text-white/50 text-sm">View live site</p>
          <p className="mt-3 text-xs text-white/35 group-hover:text-white/60 transition-colors">
            Opens in a new tab
          </p>
        </a>
      </div>

      {/* Recent orders + quick actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section
          className="adm-card adm-fade-up p-6"
          style={{ '--adm-delay': '0.3s' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display font-black uppercase italic text-lg text-white">
              Recent <span className="text-lime">orders</span>
            </h2>
            <Link href="/admin/orders" className="text-xs text-white/40 hover:text-lime transition-colors">
              View all ↗
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-6 py-10 text-center text-white/30 text-sm border border-dashed border-white/10 rounded-2xl">
              — no orders yet —
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-white/35 text-xs uppercase tracking-wider">
                    <th className="py-2 pr-4 font-normal">Order</th>
                    <th className="py-2 pr-4 font-normal">Amount</th>
                    <th className="py-2 pr-4 font-normal">Status</th>
                    <th className="py-2 font-normal">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-white/5">
                      <td className="py-3 pr-4 font-mono text-xs text-white/60">
                        #{String(o.id).slice(0, 8)}
                      </td>
                      <td className="py-3 pr-4 text-lime font-display font-bold">
                        {formatAED(o.amount_aed)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs uppercase tracking-wider text-white/60 border border-white/15 rounded-full px-2.5 py-0.5">
                          {o.status ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 text-white/40 text-xs">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('en-AE') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          className="adm-card adm-fade-up p-6"
          style={{ '--adm-delay': '0.36s' } as React.CSSProperties}
        >
          <h2 className="font-display font-black uppercase italic text-lg text-white">
            Quick <span className="text-lime">actions</span>
          </h2>
          <div className="mt-4 space-y-3">
            <Link
              href="/admin/products/new"
              className="flex items-center justify-between rounded-2xl border border-white/10 px-5 py-4 text-sm text-white/70 hover:text-white hover:border-lime/40 transition-colors group"
            >
              <span className="flex items-center gap-3">
                <Plus className="w-4 h-4 text-lime" />
                Add product
              </span>
              <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-lime transition-colors" />
            </Link>
            <Link
              href="/admin/content"
              className="flex items-center justify-between rounded-2xl border border-white/10 px-5 py-4 text-sm text-white/70 hover:text-white hover:border-lime/40 transition-colors group"
            >
              <span className="flex items-center gap-3">
                <PenLine className="w-4 h-4 text-lime" />
                Edit homepage copy
              </span>
              <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-lime transition-colors" />
            </Link>
            <Link
              href="/shop"
              className="flex items-center justify-between rounded-2xl border border-white/10 px-5 py-4 text-sm text-white/70 hover:text-white hover:border-lime/40 transition-colors group"
            >
              <span className="flex items-center gap-3">
                <Store className="w-4 h-4 text-lime" />
                Open shop
              </span>
              <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-lime transition-colors" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
