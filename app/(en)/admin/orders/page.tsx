import { supabaseServer } from '@/lib/supabase/server';
import { formatAED } from '@/lib/utils';
import type { Order } from '@/lib/types';
import OrderStatusSelect from '@/components/admin/OrderStatusSelect';

export const dynamic = 'force-dynamic';

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

export default async function AdminOrders() {
  const supabase = await supabaseServer();
  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

  return (
    <div className="adm-grid-bg space-y-8">
      <div className="space-y-2 adm-fade-up">
        <p className="adm-eyebrow">/// COMMAND DECK</p>
        <h1 className="font-display font-black uppercase italic text-3xl md:text-4xl text-white tracking-tight">
          ORDER <span className="text-lime">FLOW</span>
        </h1>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-white/50 border border-white/10 rounded-full px-3 py-1 bg-white/[.03]">
          <span className="adm-live-dot" />
          {orders?.length ?? 0} ORDERS
        </span>
      </div>
      <div className="space-y-3">
        {(orders as Order[] | null)?.map((o, idx) => (
          <div
            key={o.id}
            className="adm-card adm-card-lift adm-fade-up p-5 flex flex-col md:flex-row md:items-center gap-4"
            style={{ '--adm-delay': `${Math.min(idx, 8) * 0.05 + 0.06}s` } as React.CSSProperties}
          >
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">
                {o.customer_name ?? 'Customer'} <span className="text-white/30 text-sm">· {o.customer_email}</span>
              </p>
              <p className="text-white/50 text-sm mt-1">
                {o.items.map((i) => `${i.title} ×${i.qty}`).join(' · ')}
              </p>
              {(() => {
                const ship = formatShipping(o.shipping);
                return ship ? (
                  <p className="text-white/70 text-sm mt-2">
                    <span className="text-white/40 text-xs uppercase tracking-wider mr-2">Deliver to</span>
                    {ship.name ? `${ship.name} · ` : ''}{ship.lines}
                  </p>
                ) : null;
              })()}
              <p className="text-white/35 font-mono text-xs mt-2">
                <span className="text-lime/60">#</span>{o.id.slice(0, 8).toUpperCase()} · {new Date(o.created_at).toLocaleString('en-AE')} {o.customer_phone ? `· ${o.customer_phone}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white font-display font-bold text-lg">{formatAED(o.amount_aed)}</span>
              <OrderStatusSelect id={o.id} status={o.status} />
            </div>
          </div>
        ))}
        {(!orders || orders.length === 0) && (
          <p className="adm-card adm-fade-up text-white/30 py-16 text-center" style={{ '--adm-delay': '0.06s' } as React.CSSProperties}>
            No orders yet — they&apos;ll appear here the moment Stripe confirms a payment.
          </p>
        )}
      </div>
    </div>
  );
}
