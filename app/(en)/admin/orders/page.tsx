import { supabaseServer } from '@/lib/supabase/server';
import type { Order } from '@/lib/types';
import OrdersList from '@/components/admin/OrdersList';

export const dynamic = 'force-dynamic';

export default async function AdminOrders() {
  const supabase = await supabaseServer();
  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  const list = (orders as Order[] | null) ?? [];

  return (
    <div className="adm-grid-bg space-y-8">
      <div className="space-y-2 adm-fade-up">
        <p className="adm-eyebrow">/// COMMAND DECK</p>
        <h1 className="font-display font-black uppercase italic text-3xl md:text-4xl text-white tracking-tight">
          ORDER <span className="text-lime">FLOW</span>
        </h1>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-white/50 border border-white/10 rounded-full px-3 py-1 bg-white/[.03]">
          <span className="adm-live-dot" />
          {list.length} ORDERS
        </span>
      </div>
      <OrdersList orders={list} />
    </div>
  );
}
