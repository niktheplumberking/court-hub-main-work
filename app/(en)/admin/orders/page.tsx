import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sweepExpiredHolds } from '@/lib/shop/fulfill';
import type { Order } from '@/lib/types';
import OrdersList from '@/components/admin/OrdersList';

export const dynamic = 'force-dynamic';

export default async function AdminOrders() {
  // Opening the orders page also frees any stock stuck in long-abandoned checkouts.
  await sweepExpiredHolds();

  const supabase = await supabaseServer();
  const [{ data: orders }, { count: inCheckout }] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5000),
    supabaseAdmin()
      .from('checkout_holds')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'held')
      .gt('expires_at', new Date().toISOString()),
  ]);
  const list = (orders as Order[] | null) ?? [];
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  const stripeLive = key.startsWith('sk_live') || key.startsWith('rk_live');

  return (
    <div className="adm-grid-bg space-y-8">
      <div className="space-y-2 adm-fade-up">
        <p className="adm-eyebrow">/// COMMAND DECK</p>
        <h1 className="font-display font-black uppercase italic text-3xl md:text-4xl text-white tracking-tight">
          ORDER <span className="text-lime">FLOW</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] text-white/50 border border-white/10 rounded-full px-3 py-1 bg-white/[.03]">
            <span className="adm-live-dot" />
            {list.length} ORDERS
          </span>
          {(inCheckout ?? 0) > 0 && (
            <span
              className="inline-flex items-center gap-2 font-mono text-[11px] text-white/50 border border-white/10 rounded-full px-3 py-1 bg-white/[.03]"
              title="Shoppers on the Stripe payment page right now. Their items are reserved for up to 30 minutes."
            >
              {inCheckout} PAYING NOW
            </span>
          )}
        </div>
      </div>
      <OrdersList orders={list} stripeLive={stripeLive} />
    </div>
  );
}
