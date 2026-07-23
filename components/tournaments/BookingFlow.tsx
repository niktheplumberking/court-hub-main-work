'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import type { Division, Tournament } from '@/lib/tournaments/data';
import type { StripeReturn } from '@/lib/tournaments/admin-types';
import { createRegistration } from '@/lib/actions/tournaments';
import { useTournamentStore } from '@/lib/tournaments/store';
import { useT, useLocalePath } from '@/lib/i18n/LocaleProvider';
import type { Dict } from '@/lib/i18n/dict';
import { TierBadge, money, btn, divisionLabel } from './ui';

interface TeamData {
  captain: string;
  email: string;
  phone: string;
  nat: string;
  level: string;
  partner: string;
  pcontact: string;
}

const EMPTY: TeamData = { captain: '', email: '', phone: '', nat: '', level: '', partner: '', pcontact: '' };
type BookingDict = Dict['booking'];
const STEPS: ((b: BookingDict) => string)[] = [
  (b) => b.stepTeam,
  (b) => b.stepReview,
  (b) => b.stepPayment,
  (b) => b.stepDone,
];
// Stored level values stay English (data); labels render via the dictionary.
const LEVELS: { value: string; label: (b: BookingDict) => string }[] = [
  { value: 'Beginner (new to competition)', label: (b) => b.levelBeginner },
  { value: 'Intermediate (club player)', label: (b) => b.levelIntermediate },
  { value: 'Advanced (regular competitor)', label: (b) => b.levelAdvanced },
  { value: 'Pro / ex-pro', label: (b) => b.levelPro },
];
const levelLabel = (b: BookingDict, value: string) =>
  LEVELS.find((l) => l.value === value)?.label(b) ?? value;
const METHODS: { id: string; name: (b: BookingDict) => string; sub: (b: BookingDict) => string; icon: string }[] = [
  { id: 'card', name: (b) => b.cardTitle, sub: (b) => b.cardSub, icon: 'CARD' },
  { id: 'apple', name: (b) => b.applePay, sub: (b) => b.applePaySub, icon: 'Pay' },
  { id: 'tabby', name: () => 'Tabby', sub: (b) => b.tabbySub, icon: 'tabby' },
  { id: 'tamara', name: () => 'Tamara', sub: (b) => b.tamaraSub, icon: 'tamara' },
];
const last = (s: string) => s.trim().split(' ').pop() ?? '';

export default function BookingFlow({
  slug,
  tournament,
  stripeEnabled,
  stripeReturn,
}: {
  slug: string;
  /** Server-store tournament, or null when the slug only lives in the client session store. */
  tournament: Tournament | null;
  stripeEnabled: boolean;
  stripeReturn: StripeReturn | null;
}) {
  const { getTournament, addBooking, toast } = useTournamentStore();
  const router = useRouter();
  const dict = useT();
  const tb = dict.booking;
  const tt = dict.tournaments;
  const lp = useLocalePath();
  const t = tournament ?? getTournament(slug);

  const [step, setStep] = useState(stripeReturn ? 4 : 1);
  const [data, setData] = useState<TeamData>(
    stripeReturn?.reg
      ? { ...EMPTY, captain: stripeReturn.reg.captain, partner: stripeReturn.reg.partner, email: stripeReturn.reg.email }
      : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ num: '', exp: '', cvc: '', name: '' });
  const [paying, setPaying] = useState(false);
  const [refCode, setRefCode] = useState(stripeReturn?.reg?.ref ?? '');

  // Real Stripe checkout only exists for tournaments the server knows about.
  const useStripe = stripeEnabled && !!tournament;

  // Only reachable for open events; redirect otherwise, but never bounce a
  // returning payer landing back with a session_id confirmation.
  useEffect(() => {
    if (t && t.status !== 'open' && !stripeReturn) router.replace(lp(`/tournaments/${slug}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t?.status, slug, router, t, stripeReturn]);

  if (!t) notFound();
  if (t.status !== 'open' && !stripeReturn) return null; // redirecting

  const set = (k: keyof TeamData, v: string) => setData((d) => ({ ...d, [k]: v }));

  function validateTeam(): boolean {
    const next: Record<string, boolean> = {};
    (['captain', 'email', 'phone', 'partner'] as const).forEach((k) => {
      if (!data[k].trim()) next[k] = true;
    });
    if (data.email && !/^[^@]+@[^@]+\.[^@]+$/.test(data.email)) next.email = true;
    setErrors(next);
    if (Object.keys(next).length) {
      toast(tb.fillHighlighted);
      return false;
    }
    return true;
  }

  async function pay() {
    if (!useStripe && method === 'card' && card.num.replace(/\s/g, '').length < 15) {
      toast(tb.demoCardPrompt);
      return;
    }
    setPaying(true);

    // 1. Real Stripe Checkout (active once real keys are configured).
    if (useStripe) {
      try {
        const res = await fetch('/api/tournament-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, team: data }),
        });
        const json = await res.json();
        if (res.ok && json.url) {
          window.location.href = json.url;
          return;
        }
        toast(json.error || tb.checkoutFailed);
      } catch {
        toast(tb.checkoutFailed);
      }
      setPaying(false);
      return;
    }

    // 2. Demo payment recorded in the backend (tournament exists server-side).
    if (tournament) {
      const res = await createRegistration({ slug, ...data, method });
      setPaying(false);
      if (res.ok && res.ref) {
        setRefCode(res.ref);
        setStep(4);
        toast(tb.spotBooked(res.ref));
        router.refresh();
      } else {
        toast(res.error ?? tb.bookingFailed);
      }
      return;
    }

    // 3. Session-only tournament (public demo admin): client store fallback.
    setTimeout(() => {
      const ref = 'CH-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      setRefCode(ref);
      addBooking({ slug, captain: data.captain, partner: data.partner, email: data.email, nat: data.nat, ref });
      setPaying(false);
      setStep(4);
      toast(tb.spotBooked(ref));
    }, 1100);
  }

  const pairLabel = data.captain ? `${last(data.captain)} / ${data.partner ? last(data.partner) : '…'}` : tb.yourPair;

  return (
    <div className="bg-sand text-ink">
      {/* Header */}
      <div className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          <Image src={t.cover} alt={t.name} fill sizes="100vw" className="object-cover brightness-[0.5] saturate-[1.05]" priority />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,12,0.55),rgba(14,14,12,0.9))]" />
        </div>
        <div className="relative z-[2] mx-auto max-w-[1320px] px-6 pb-6 pt-24 md:pt-28">
          <Link href={lp(`/tournaments/${slug}`)} className="mb-[22px] inline-flex items-center gap-[7px] font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/65 transition-colors hover:text-lime">
            <span className="inline-block rtl:-scale-x-100">←</span> {tb.backTo(t.name)}
          </Link>
          <div className="mb-3.5 flex flex-wrap items-center gap-2">
            <TierBadge tier={t.tier} />
            <span className="rounded-full border border-white/25 px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/80">{tt.divisionDoubles(divisionLabel(tt, t.division))}</span>
          </div>
          <h1 className="font-display text-[clamp(26px,3.6vw,42px)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white">{tb.title}</h1>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-[1320px] px-6 pb-16 pt-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.6fr_1fr]">
          <div>
            {/* Progress */}
            <div className="mb-9 flex max-w-[620px]">
              {STEPS.map((label, i) => {
                const n = i + 1;
                const done = step > n;
                const cur = step === n;
                return (
                  <div key={i} className="relative flex flex-1 flex-col gap-2">
                    {i < STEPS.length - 1 && (
                      <span className={`absolute start-[30px] end-0 top-[15px] h-0.5 ${done ? 'bg-ink' : 'bg-sand-2'}`} />
                    )}
                    <div className={`z-[2] flex h-[30px] w-[30px] items-center justify-center rounded-full font-display text-[13px] font-extrabold ${cur ? 'bg-court-blue text-white' : done ? 'bg-ink text-white' : 'bg-sand-2 text-ink/50'}`}>
                      {done ? '✓' : n}
                    </div>
                    <div className={`font-mono text-[9.5px] font-bold uppercase tracking-[0.08em] ${cur ? 'text-ink' : 'text-ink/45'}`}>{label(tb)}</div>
                  </div>
                );
              })}
            </div>

            <div key={step} className="ch-fadein max-w-[620px]">
              {step === 1 && <StepTeam data={data} errors={errors} set={set} onCancel={() => router.push(lp(`/tournaments/${slug}`))} onNext={() => { if (validateTeam()) setStep(2); }} />}
              {step === 2 && <StepReview t={t} data={data} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
              {step === 3 && (
                <StepPayment
                  fee={t.fee}
                  captain={data.captain}
                  useStripe={useStripe}
                  method={method}
                  setMethod={setMethod}
                  card={card}
                  setCard={setCard}
                  paying={paying}
                  onBack={() => setStep(2)}
                  onPay={pay}
                />
              )}
              {step === 4 && (
                <StepDone
                  t={t}
                  captain={data.captain}
                  partner={data.partner}
                  email={data.email}
                  refCode={refCode}
                  processing={!!stripeReturn && !stripeReturn.reg && !refCode}
                />
              )}
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="sticky top-[88px] rounded-[22px] bg-ink p-6 text-white">
              <h4 className="mb-4 font-display text-[13px] font-extrabold uppercase text-white/60">{tb.orderSummary}</h4>
              {[
                [tb.tournament, t.name],
                [tt.category, `${t.tier} · ${divisionLabel(tt, t.division)}`],
                [tt.dates, t.dates],
                [tt.pair, pairLabel],
                [tb.entryOnePair, `AED ${money(t.fee)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-white/10 py-2.5 text-[13.5px] text-white/75">
                  <span>{k}</span>
                  <b className="max-w-[150px] text-end font-semibold text-white">{v}</b>
                </div>
              ))}
              <div className="mt-1.5 flex items-baseline justify-between pt-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">{tb.totalLabel}</span>
                <span className="font-display text-[26px] font-black text-lime"><span className="me-[3px] font-mono text-[12px] text-white/60">AED</span>{money(t.fee)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Field primitives ----
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-[7px] block font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink/50">{label}</label>
      {children}
    </div>
  );
}
const inputCls = (err = false) =>
  `w-full rounded-xl border bg-white px-3.5 py-[13px] text-[14.5px] text-ink transition-colors placeholder:text-ink/30 focus:border-court-blue focus:outline-none ${err ? 'border-fire' : 'border-ink/10'}`;
const hintCls = "mb-3.5 mt-[26px] flex items-center gap-2.5 font-display text-[13px] font-extrabold uppercase tracking-[-0.01em] text-ink/40 before:inline-flex before:h-[26px] before:w-[26px] before:rounded-lg before:bg-sand-2 before:content-['']";

// ---- Step 1: Team ----
function StepTeam({
  data,
  errors,
  set,
  onCancel,
  onNext,
}: {
  data: TeamData;
  errors: Record<string, boolean>;
  set: (k: keyof TeamData, v: string) => void;
  onCancel: () => void;
  onNext: () => void;
}) {
  const tb = useT().booking;
  return (
    <div>
      <div className={hintCls}>{tb.captainHeading}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={tb.fullName}><input className={inputCls(errors.captain)} placeholder={tb.phName} value={data.captain} onChange={(e) => set('captain', e.target.value)} /></Field>
        <Field label={tb.email}><input type="email" className={inputCls(errors.email)} placeholder="you@email.com" value={data.email} onChange={(e) => set('email', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={tb.mobile}><input type="tel" className={inputCls(errors.phone)} placeholder="+971 5X XXX XXXX" value={data.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label={tb.nationality}><input className={inputCls()} placeholder={tb.phNat} value={data.nat} onChange={(e) => set('nat', e.target.value)} /></Field>
      </div>
      <Field label={tb.level}>
        <select className={inputCls()} value={data.level} onChange={(e) => set('level', e.target.value)}>
          <option value="">{tb.selectLevel}</option>
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label(tb)}</option>)}
        </select>
      </Field>
      <div className={hintCls}>{tb.partnerHeading}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={tb.partnerName}><input className={inputCls(errors.partner)} placeholder={tb.phPartner} value={data.partner} onChange={(e) => set('partner', e.target.value)} /></Field>
        <Field label={tb.partnerContact}><input className={inputCls()} placeholder={tb.optional} value={data.pcontact} onChange={(e) => set('pcontact', e.target.value)} /></Field>
      </div>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onCancel} className={btn('ghost')}>{tb.cancel}</button>
        <button type="button" onClick={onNext} className={btn('ink', 'flex-1')}>{tb.continueReview}</button>
      </div>
    </div>
  );
}

// ---- Step 2: Review ----
function StepReview({ t, data, onBack, onNext }: { t: { name: string; tier: string; division: string; dates: string; venue: string; fee: number }; data: TeamData; onBack: () => void; onNext: () => void }) {
  const dict = useT();
  const tb = dict.booking;
  const tt = dict.tournaments;
  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="flex justify-between gap-3 border-b border-ink/10 py-[11px] text-[13.5px] last:border-b-0">
      <span className="text-ink/55">{k}</span>
      <span className="text-end font-semibold text-ink">{v}</span>
    </div>
  );
  return (
    <div>
      <div className="rounded-[22px] border border-ink/10 bg-sand-card p-6">
        <h4 className="mb-4 font-display text-[14px] font-extrabold uppercase">{tb.yourPair}</h4>
        <Row k={tb.captain} v={data.captain} />
        <Row k={tb.contact} v={`${data.email} · ${data.phone}`} />
        <Row k={tb.nationality} v={data.nat || '–'} />
        <Row k={tb.levelShort} v={data.level ? levelLabel(tb, data.level) : '–'} />
        <Row k={tb.partner} v={data.partner} />
      </div>
      <div className="mt-4 rounded-[22px] border border-ink/10 bg-sand-card p-6">
        <h4 className="mb-4 font-display text-[14px] font-extrabold uppercase">{tb.whatEntering}</h4>
        <Row k={tb.event} v={t.name} />
        <Row k={tt.category} v={`${t.tier} · ${tt.divisionDoubles(divisionLabel(tt, t.division as Division))}`} />
        <Row k={tt.dates} v={t.dates} />
        <Row k={tt.venue} v={t.venue} />
        <Row k={tb.entryFee} v={`AED ${money(t.fee)}`} />
      </div>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onBack} className={btn('ghost')}>{tb.back}</button>
        <button type="button" onClick={onNext} className={btn('ink', 'flex-1')}>{tb.continuePayment}</button>
      </div>
    </div>
  );
}

// ---- Step 3: Payment (Stripe when configured, demo otherwise) ----
function StepPayment({
  fee,
  captain,
  useStripe,
  method,
  setMethod,
  card,
  setCard,
  paying,
  onBack,
  onPay,
}: {
  fee: number;
  captain: string;
  useStripe: boolean;
  method: string;
  setMethod: (m: string) => void;
  card: { num: string; exp: string; cvc: string; name: string };
  setCard: (c: { num: string; exp: string; cvc: string; name: string }) => void;
  paying: boolean;
  onBack: () => void;
  onPay: () => void;
}) {
  const dict = useT();
  const tb = dict.booking;
  const fmtNum = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
  };
  const fmtCvc = (v: string) => v.replace(/\D/g, '').slice(0, 4);

  if (useStripe) {
    return (
      <div>
        <div className="mb-[22px] flex items-center gap-[11px] rounded-xl border border-ink/10 bg-sand-card px-4 py-3 text-[12.5px] text-ink/70">
          <b className="font-display text-[11px] font-extrabold uppercase tracking-[0.04em]">{tb.secureCheckout}</b>
          {tb.secureCheckoutBody}
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onBack} disabled={paying} className={btn('ghost')}>{tb.back}</button>
          <button type="button" onClick={onPay} disabled={paying} className={btn('lime', 'flex-1')}>{paying ? dict.cart.redirecting : tb.payStripe(`AED ${money(fee)}`)}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-[22px] flex items-center gap-[11px] rounded-xl border border-ink/10 bg-lime/[0.18] px-4 py-3 text-[12.5px] text-ink/70">
        <b className="font-display text-[11px] font-extrabold uppercase tracking-[0.04em]">{tb.demoMode}</b>
        {tb.demoNotice}
      </div>
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">{tb.choosePayment}</p>
      <div className="mb-[22px] flex flex-col gap-2.5">
        {METHODS.map((m) => {
          const on = method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              aria-pressed={on}
              className={`flex items-center gap-3.5 rounded-[14px] border-[1.5px] p-4 text-start transition-colors ${on ? 'border-court-blue bg-court-blue/[0.04]' : 'border-ink/10 bg-sand-card'}`}
            >
              <span className={`relative h-5 w-5 flex-none rounded-full border-2 ${on ? 'border-court-blue' : 'border-ink/25'}`}>
                {on && <span className="absolute inset-1 rounded-full bg-court-blue" />}
              </span>
              <span className="flex h-7 w-[42px] flex-none items-center justify-center rounded-md border border-ink/10 bg-white font-display text-[10px] font-extrabold tracking-[-0.02em] text-ink">{m.icon}</span>
              <span>
                <b className="block font-display text-[14px] font-bold text-ink">{m.name(tb)}</b>
                <span className="text-[11.5px] text-ink/50">{m.sub(tb)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {method === 'card' && (
        <div>
          <Field label={tb.cardNumber}><input inputMode="numeric" className={`${inputCls()} ltr-island`} placeholder="4242 4242 4242 4242" value={card.num} onChange={(e) => setCard({ ...card, num: fmtNum(e.target.value) })} /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={tb.expiry}><input className={`${inputCls()} ltr-island`} placeholder="MM / YY" value={card.exp} onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })} /></Field>
            <Field label={tb.cvc}><input inputMode="numeric" className={`${inputCls()} ltr-island`} placeholder="123" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: fmtCvc(e.target.value) })} /></Field>
          </div>
          <Field label={tb.nameOnCard}><input className={inputCls()} placeholder={captain || tb.fullName} value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} /></Field>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onBack} disabled={paying} className={btn('ghost')}>{tb.back}</button>
        <button type="button" onClick={onPay} disabled={paying} className={btn('lime', 'flex-1')}>{paying ? tb.processing : tb.payDemo(`AED ${money(fee)}`)}</button>
      </div>
    </div>
  );
}

// ---- Step 4: Confirmation ----
function StepDone({
  t,
  captain,
  partner,
  email,
  refCode,
  processing,
}: {
  t: { slug: string; name: string };
  captain: string;
  partner: string;
  email: string;
  refCode: string;
  processing: boolean;
}) {
  const { toast } = useTournamentStore();
  const tb = useT().booking;
  const lp = useLocalePath();

  if (processing) {
    return (
      <div className="mx-auto max-w-[560px] rounded-[36px] border border-ink/10 bg-sand-card p-[48px_36px] text-center">
        <h2 className="mb-2.5 font-display text-[30px] font-black uppercase">{tb.paymentReceived}</h2>
        <p className="text-[14.5px] leading-[1.6] text-ink/60">{tb.paymentReceivedBody}</p>
        <div className="mt-[26px] flex flex-wrap justify-center gap-2.5">
          <Link href={lp(`/tournaments/${t.slug}`)} className={btn('ink')}>{tb.backToTournament}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[560px] rounded-[36px] border border-ink/10 bg-sand-card p-[48px_36px] text-center">
      <div className="mx-auto mb-[22px] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green">
        <svg viewBox="0 0 24 24" className="h-[34px] w-[34px]" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
      </div>
      <h2 className="mb-2.5 font-display text-[30px] font-black uppercase">{tb.youreIn}</h2>
      <p className="text-[14.5px] leading-[1.6] text-ink/60"><b className="text-ink">{last(captain)} / {last(partner)}</b> {tb.registeredFor}</p>
      <p className="mt-1.5 font-display text-[18px] font-extrabold uppercase text-ink">{t.name}</p>
      <div className="my-6 rounded-[14px] bg-ink p-4 font-mono text-white">
        <div className="text-[9px] uppercase tracking-[0.16em] text-white/50">{tb.bookingRef}</div>
        <div className="mt-1 text-[22px] font-bold tracking-[0.05em]"><span className="ltr-island">{refCode}</span></div>
      </div>
      <p className="text-[13px] text-ink/60">{tb.confirmationNote(email)}</p>
      <div className="mt-[26px] flex flex-wrap justify-center gap-2.5">
        <Link href={lp(`/tournaments/${t.slug}/teams`)} className={btn('ink')}>{tb.viewTeams}</Link>
        <button type="button" onClick={() => toast(tb.calendarDownloaded)} className={btn('ghost')}>{tb.addCalendar}</button>
      </div>
    </div>
  );
}
