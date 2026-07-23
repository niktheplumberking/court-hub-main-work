import { redirect } from 'next/navigation';
import BookingFlow from '@/components/tournaments/BookingFlow';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { getStripe } from '@/lib/stripe';
import type { StripeReturn } from '@/lib/tournaments/admin-types';
import {
  addRegistration,
  getRegistrationBySession,
  getTournament,
} from '@/lib/tournaments/server-store';

export const metadata = {
  title: 'Book Your Spot — Court Hub',
  robots: { index: false },
};

// Fresh status/capacity on every request, plus Stripe return handling.
export const dynamic = 'force-dynamic';

/**
 * After a paid Stripe Checkout, the customer returns here with ?session_id=.
 * We verify the session with Stripe and record the registration (idempotent
 * per session id). At the final stage this recording moves into the webhook
 * with durable Supabase storage; the page then just looks the row up.
 */
async function resolveStripeReturn(sessionId: string): Promise<StripeReturn> {
  try {
    const existing = await getRegistrationBySession(sessionId);
    if (existing) {
      return {
        sessionId,
        reg: { ref: existing.ref, captain: existing.captain, partner: existing.partner, email: existing.email },
      };
    }
    const stripe = getStripe();
    if (!stripe) return { sessionId, reg: null };
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const m = session.metadata;
    if (session.payment_status !== 'paid' || m?.type !== 'tournament_registration' || !m.slug) {
      return { sessionId, reg: null };
    }
    const reg = await addRegistration({
      slug: m.slug,
      captain: m.captain ?? '',
      email: m.email ?? session.customer_details?.email ?? '',
      phone: m.phone ?? session.customer_details?.phone ?? '',
      nat: m.nat ?? '',
      level: m.level ?? '',
      partner: m.partner ?? '',
      pcontact: m.pcontact ?? '',
      method: 'stripe',
      status: 'paid',
      amount: (session.amount_total ?? 0) / 100,
      stripeSessionId: sessionId,
    });
    return {
      sessionId,
      reg: { ref: reg.ref, captain: reg.captain, partner: reg.partner, email: reg.email },
    };
  } catch (e) {
    console.error('[tournaments] stripe return failed', e);
    return { sessionId, reg: null };
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { slug } = await params;
  const { session_id } = await searchParams;

  const t = await getTournament(slug);
  // Booking is only for open events, but never bounce a returning payer whose
  // confirmation carries a session_id.
  if (t && t.status !== 'open' && !session_id) redirect(`/tournaments/${slug}`);

  const stripeEnabled = !!getStripe();
  const stripeReturn = session_id ? await resolveStripeReturn(session_id) : null;

  return (
    <>
      <HeroFrameNav active="tournaments" fixedBar />
      <BookingFlow
        slug={slug}
        tournament={t ?? null}
        stripeEnabled={stripeEnabled}
        stripeReturn={stripeReturn}
      />
    </>
  );
}
