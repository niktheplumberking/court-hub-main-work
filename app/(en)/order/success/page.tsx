import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';
import { fulfillCheckoutSession } from '@/lib/shop/fulfill';
import SiteHeader from '@/components/shared/SiteHeader';
import SmoothScroll from '@/components/shared/SmoothScroll';
import Footer from '@/components/home/Footer';
import SuccessReveal from '@/components/shop/SuccessReveal';
import { formatAED } from '@/lib/utils';
import ClearCart from '@/components/shop/ClearCart';
import { waHref } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

// ─── PLACEHOLDER COPY — replace with client-provided copy (contract §8) ───
const COPY = {
  metaTitle: 'Order Confirmed | Court Hub',
  continueCta: 'CONTINUE SHOPPING',
  backHomeCta: 'BACK HOME',
};
// ─── End placeholder copy ───

export const metadata = {
  title: COPY.metaTitle,
  robots: { index: false, follow: false },
};

// Anyone holding the link can open this page, so it never shows full personal
// data: j***@gmail.com instead of the address.
function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  return `${user.slice(0, 1)}***@${domain}`;
}

export default async function OrderSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!session_id || !/^cs_[A-Za-z0-9_]+$/.test(session_id)) redirect('/shop');

  // Ask Stripe directly whether this checkout is paid — never trust the URL
  // alone. If it is paid and the webhook hasn't landed yet (slow, retried or
  // misconfigured), record the order right here; the webhook will then find it
  // already done. Both paths are idempotent.
  let paid = false;
  const stripe = getStripe();
  if (stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      paid = session.status === 'complete' && session.payment_status !== 'unpaid';
      if (paid) await fulfillCheckoutSession(session);
    } catch (e) {
      console.error('[order/success] could not confirm session', session_id, e);
    }
  }

  const { data: order } = await supabaseAdmin()
    .from('orders').select('*').eq('stripe_session_id', session_id).maybeSingle();
  if (order) paid = true;

  if (!paid) {
    return (
      <main className="min-h-screen bg-sand text-ink">
        <SiteHeader spacer />
        <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-white border border-court-blue/15 flex items-center justify-center text-court-blue text-2xl font-black">!</div>
          <h1 className="font-display font-black uppercase tracking-tight text-3xl md:text-4xl">Payment not completed</h1>
          <p className="text-ink/60">
            We could not confirm a payment for this checkout. Nothing has been charged by us. Your bag is still saved.
          </p>
          <Link href="/shop" className="inline-block px-8 py-4 rounded-full bg-court-blue text-white font-bold hover:brightness-110 active:scale-95 transition-[filter,transform] duration-200">
            BACK TO THE SHOP
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const items = (order?.items as { title: string; qty: number; price_aed: number }[] | undefined) ?? [];
  const firstName = (order?.customer_name ?? '').trim().split(/\s+/)[0] || '';
  const ref = order ? order.id.slice(0, 8).toUpperCase() : '';
  const when = order
    ? new Date(order.created_at).toLocaleString('en-AE', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' })
    : '';
  const units = items.reduce((n, i) => n + i.qty, 0);
  const steps = [
    { t: 'Order confirmed', d: 'Payment received securely via Stripe.', done: true },
    { t: 'Packed with care', d: 'We prepare and inspect your gear, usually within 24 hours.', done: false },
    { t: 'Delivered across the UAE', d: 'We contact you on WhatsApp or phone to arrange delivery.', done: false },
  ];

  return (
    <main className="ch-light min-h-screen bg-sand text-ink overflow-hidden">
      <SiteHeader spacer />
      <ClearCart />
      <SmoothScroll>
        <SuccessReveal>
          <section className="relative px-5 pt-16 pb-24 md:pt-24 md:pb-32">
            {/* Ambient court-light glows + faint court lines */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.18)_0%,transparent_62%)]" />
              <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(142,197,255,0.35)_0%,transparent_65%)]" />
              <div className="absolute inset-0 opacity-[0.35] bg-[linear-gradient(to_right,rgba(31,95,214,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,95,214,0.06)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
            </div>

            <div className="relative max-w-[1080px] mx-auto grid gap-10 lg:gap-14 lg:grid-cols-[1.05fr_1fr] items-start">
              {/* Left: celebration + next steps */}
              <div className="text-center lg:text-start space-y-7">
                <div data-success-pop className="ch-check mx-auto lg:mx-0 will-change-transform" aria-hidden>
                  <span className="ch-check-ring" />
                  <span className="ch-check-ring ch-check-ring--2" />
                  <svg viewBox="0 0 52 52" className="relative w-12 h-12">
                    <path className="ch-check-path" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" d="M14 27 L23 36 L39 17" />
                  </svg>
                </div>

                <div className="space-y-3">
                  <p data-success-rise className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-court-blue">
                    Order confirmed{ref ? ` · #${ref}` : ''}
                  </p>
                  <h1 className="font-display font-black uppercase tracking-[-0.03em] leading-[0.92] text-[clamp(38px,6vw,68px)]">
                    <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
                      <span data-success-line className="block will-change-transform">
                        {firstName ? (
                          <>
                            Thank you,
                            <br />
                            <span className="text-court-blue">{firstName}!</span>
                          </>
                        ) : (
                          <>
                            Thank <span className="text-court-blue">you!</span>
                          </>
                        )}
                      </span>
                    </span>
                  </h1>
                  <p data-success-rise className="text-ink/60 text-[15px] leading-relaxed max-w-md mx-auto lg:mx-0">
                    Your padel gear is reserved for you. Here is what happens next.
                  </p>
                </div>

                <ol data-success-rise className="relative space-y-5 text-start max-w-md mx-auto lg:mx-0">
                  <span aria-hidden className="absolute start-[15px] top-3 bottom-3 w-px bg-gradient-to-b from-court-blue via-court-blue/30 to-court-blue/10" />
                  {steps.map((st, i) => (
                    <li key={st.t} className="relative flex gap-4">
                      <span
                        className={`relative z-10 shrink-0 w-[31px] h-[31px] rounded-full flex items-center justify-center text-[12px] font-black ${
                          st.done
                            ? 'bg-court-blue text-white shadow-[0_0_0_5px_rgba(31,95,214,0.15)]'
                            : 'bg-white text-court-blue border border-court-blue/25'
                        }`}
                      >
                        {st.done ? '✓' : i + 1}
                      </span>
                      <div className="pt-1">
                        <p className="font-display font-extrabold uppercase text-[14px] tracking-tight">{st.t}</p>
                        <p className="text-ink/55 text-[13px] leading-relaxed">{st.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Right: the receipt ticket */}
              <div data-success-rise className="relative">
                <div className="rounded-[28px] bg-white shadow-[0_30px_80px_-30px_rgba(10,42,102,0.35)] border border-court-blue/10 overflow-hidden">
                  <div className="relative px-7 pt-7 pb-6 bg-gradient-to-br from-[#0A2A66] via-[#12387F] to-[#1F5FD6] text-white">
                    <div aria-hidden className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_85%_15%,rgba(142,197,255,0.8),transparent_45%)]" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/60">Receipt</p>
                        <p className="font-display font-black text-2xl tracking-tight mt-1">
                          COURT <span className="text-[#8EC5FF]">HUB</span>
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8EC5FF] shadow-[0_0_8px_#8EC5FF]" /> Paid
                      </span>
                    </div>
                    {order && (
                      <div className="relative mt-5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-white/70">
                        <span>#{ref}</span>
                        <span>{when}</span>
                        <span>{units === 1 ? '1 item' : `${units} items`}</span>
                      </div>
                    )}
                  </div>

                  {/* Ticket perforation */}
                  <div aria-hidden className="relative h-0">
                    <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-sand" />
                    <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-sand" />
                  </div>

                  <div className="px-7 pt-6 pb-7 space-y-3">
                    {order ? (
                      <>
                        {items.map((i, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-ink font-medium leading-snug">
                              {i.title} <span className="text-ink/40 font-mono text-xs">× {i.qty}</span>
                            </span>
                            <span className="text-ink/70 whitespace-nowrap font-mono text-[13px]">{formatAED(i.price_aed * i.qty)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm text-ink/50 pt-1">
                          <span>Delivery</span>
                          <span className="text-court-blue font-bold uppercase text-[11px] tracking-widest">Free</span>
                        </div>
                        <div className="border-t border-dashed border-court-blue/25 pt-4 flex items-end justify-between">
                          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink/50">Total paid</span>
                          <span className="font-display font-black text-3xl text-ink">{formatAED(order.amount_aed)}</span>
                        </div>
                        {order.customer_email && (
                          <p className="text-ink/45 text-xs leading-relaxed pt-1">
                            Paid by {maskEmail(order.customer_email)}. Keep this page for your records.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-ink/60 text-sm">Payment received. Your order is being recorded; refresh in a moment to see the summary.</p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/shop"
                    className="flex-1 text-center px-7 py-4 rounded-full bg-court-blue text-white text-xs font-bold uppercase tracking-widest shadow-[0_12px_30px_-8px_rgba(31,95,214,0.6)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-8px_rgba(31,95,214,0.7)] transition-all duration-300"
                  >
                    {COPY.continueCta}
                  </Link>
                  <a
                    href={waHref(ref ? `Hi Court Hub! I just placed order #${ref}. ` : 'Hi Court Hub! I just placed an order. ')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-7 py-4 rounded-full bg-white border border-court-blue/20 text-ink text-xs font-bold uppercase tracking-widest hover:border-court-blue hover:text-court-blue transition-colors duration-300"
                  >
                    WhatsApp us
                  </a>
                </div>
                <Link href="/" className="mt-4 block text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink/40 hover:text-court-blue transition-colors">
                  {COPY.backHomeCta} →
                </Link>
              </div>
            </div>
          </section>
        </SuccessReveal>
        <Footer />
      </SmoothScroll>
    </main>
  );
}
