import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { formatAED } from '@/lib/utils';
import type { Product } from '@/lib/types';
import DeleteProductButton from '@/components/admin/DeleteProductButton';

export const dynamic = 'force-dynamic';

const statusColors: Record<string, string> = {
  active: 'bg-lime/15 text-lime', draft: 'bg-white/10 text-white/50',
  sold: 'bg-court-blue/20 text-court-blue', archived: 'bg-white/5 text-white/30',
};

export default async function AdminProducts() {
  const supabase = await supabaseServer();
  const { data: products } = await supabase
    .from('products').select('*, categories(name)').order('created_at', { ascending: false });

  return (
    <div className="adm-grid-bg space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 adm-fade-up">
        <div className="space-y-2">
          <p className="adm-eyebrow">/// INVENTORY DECK</p>
          <h1 className="font-display font-black uppercase italic text-3xl md:text-4xl text-white tracking-tight">
            YOUR <span className="text-lime">ARSENAL</span>
          </h1>
          <span className="inline-flex items-center gap-2 font-mono text-[11px] text-white/50 border border-white/10 rounded-full px-3 py-1 bg-white/[.03]">
            <span className="adm-live-dot" />
            {products?.length ?? 0} PRODUCTS
          </span>
        </div>
        <Link href="/admin/products/new" className="adm-pulse px-6 py-3 rounded-full bg-lime text-ink font-bold text-sm hover:brightness-110 transition">+ ADD PRODUCT</Link>
      </div>
      <div className="adm-card overflow-hidden adm-fade-up" style={{ '--adm-delay': '0.06s' } as React.CSSProperties}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/30 text-xs uppercase tracking-wider border-b border-white/5">
              <th className="px-5 py-4 font-medium">Product</th>
              <th className="px-5 py-4 font-medium hidden md:table-cell">Category</th>
              <th className="px-5 py-4 font-medium">Price</th>
              <th className="px-5 py-4 font-medium hidden md:table-cell">Stock</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody>
            {(products as (Product & { categories: { name: string } })[] | null)?.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[.04] transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-ink border border-white/10 overflow-hidden shrink-0">
                      {p.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-white group-hover:text-lime transition-colors line-clamp-1">{p.title}</span>
                  </Link>
                </td>
                <td className="px-5 py-3 text-white/50 hidden md:table-cell">{p.categories?.name}</td>
                <td className="px-5 py-3 text-white font-semibold">{formatAED(p.price_aed)}</td>
                <td className="px-5 py-3 text-white/50 font-mono text-xs hidden md:table-cell">{p.is_unique ? (p.quantity > 0 ? '1 (unique)' : '—') : p.quantity}</td>
                <td className="px-5 py-3">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase ${statusColors[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-5 py-3 text-right"><DeleteProductButton id={p.id} /></td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-white/30">No products yet. Click &quot;Add Product&quot; or import from Instagram.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
