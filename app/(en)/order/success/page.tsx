import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import SiteHeader from '@/components/shared/SiteHeader';
import SmoothScroll from '@/components/shared/SmoothScroll';
import Footer from '@/components/home/Footer';
import SuccessReveal from '@/components/shop/SuccessReveal';
import { formatAED } from '@/lib/utils';
import ClearCart from '@/components/shop/ClearCart';

export const dynamic = 'force-dynamic';

// ─── PLACEHOLDER COPY — replace with client-provided copy (contract §8) ───
const COPY = {
  metaTitle: 'Order Confirmed — Court Hub',
  continueCta: 'CONTINUE SHOPPING',
  backHomeCta: 'BACK HOME',
};
// ─── End placeholder copy ───

export const metadata = {
  title: COPY.metaTitle,
};

export default async function OrderSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  let order = null;
  if (session_id) {
    const { data } = await supabaseAdmin()
      .from('orders').select('*').eq('stripe_session_id', session_id).maybeSingle();
    order = data;
  }

  return (
    <main className="min-h-screen bg-ink">
      <SiteHeader spacer />
      <ClearCart />
      <SmoothScroll>
        <SuccessReveal>
          <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
            <div
              data-success-pop
              className="w-20 h-20 mx-auto rounded-full bg-lime/15 flex items-center justify-center will-change-transform"
            >
              <span className="text-lime text-4xl">✓</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white">
              <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
                <span data-success-line className="block will-change-transform">
                  Order confirmed!
                </span>
              </span>
            </h1>
            {order ? (
              <div
                data-success-rise
                className="bg-ink-2 rounded-[20px] p-6 text-left space-y-3 border border-white/5"
              >
                <p className="text-white/40 text-xs uppercase tracking-wider">Order summary</p>
                {(order.items as { title: string; qty: number; price_aed: number }[]).map((i, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-white">{i.title} × {i.qty}</span>
                    <span className="text-white/60">{formatAED(i.price_aed * i.qty)}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-3 flex justify-between font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-lime">{formatAED(order.amount_aed)}</span>
                </div>
                {order.customer_email && (
                  <p className="text-white/40 text-xs">A confirmation was sent to {order.customer_email}</p>
                )}
              </div>
            ) : (
              <p data-success-rise className="text-white/50">
                Payment received — your order is being processed. Refresh in a moment to see the summary.
              </p>
            )}
            <div data-success-rise className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/shop"
                className="inline-block px-8 py-4 rounded-full bg-lime text-ink font-bold hover:brightness-110 active:scale-95 transition-[filter,transform] duration-200"
              >
                {COPY.continueCta}
              </Link>
              <Link
                href="/"
                className="inline-block px-8 py-4 rounded-full border border-white/15 text-white font-bold hover:border-lime/60 hover:text-lime active:scale-95 transition-[border-color,color,transform] duration-200"
              >
                {COPY.backHomeCta}
              </Link>
            </div>
          </div>
        </SuccessReveal>
        <Footer />
      </SmoothScroll>
    </main>
  );
}
