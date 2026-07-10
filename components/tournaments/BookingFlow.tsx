'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { useTournamentStore } from '@/lib/tournaments/store';
import { TierBadge, money, btn } from './ui';

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
const STEPS = ['Team', 'Review', 'Payment', 'Done'];
const LEVELS = ['Beginner (new to competition)', 'Intermediate (club player)', 'Advanced (regular competitor)', 'Pro / ex-pro'];
const METHODS: { id: string; name: string; sub: string; icon: string }[] = [
  { id: 'card', name: 'Credit / Debit Card', sub: 'Visa, Mastercard', icon: 'CARD' },
  { id: 'apple', name: 'Apple Pay', sub: 'Pay with Touch/Face ID', icon: 'Pay' },
  { id: 'tabby', name: 'Tabby', sub: 'Split in 4 · interest-free', icon: 'tabby' },
  { id: 'tamara', name: 'Tamara', sub: 'Pay later · 0% interest', icon: 'tamara' },
];
const last = (s: string) => s.trim().split(' ').pop() ?? '';

export default function BookingFlow({ slug }: { slug: string }) {
  const { getTournament, addBooking, toast } = useTournamentStore();
  const router = useRouter();
  const t = getTournament(slug);

  const [step, setStep] = useState(1);
  const [data, setData] = useState<TeamData>(EMPTY);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ num: '', exp: '', cvc: '', name: '' });
  const [paying, setPaying] = useState(false);
  const [refCode, setRefCode] = useState('');

  // Only reachable for open events; redirect otherwise (matches the demo).
  useEffect(() => {
    if (t && t.status !== 'open') router.replace(`/tournaments/${slug}`);
  }, [t?.status, slug, router, t]);

  if (!t) notFound();
  if (t.status !== 'open') return null; // redirecting

  const set = (k: keyof TeamData, v: string) => setData((d) => ({ ...d, [k]: v }));

  function validateTeam(): boolean {
    const next: Record<string, boolean> = {};
    (['captain', 'email', 'phone', 'partner'] as const).forEach((k) => {
      if (!data[k].trim()) next[k] = true;
    });
    if (data.email && !/^[^@]+@[^@]+\.[^@]+$/.test(data.email)) next.email = true;
    setErrors(next);
    if (Object.keys(next).length) {
      toast('Please fill the highlighted fields');
      return false;
    }
    return true;
  }

  function pay() {
    if (method === 'card' && card.num.replace(/\s/g, '').length < 15) {
      toast('Enter any demo card number to continue');
      return;
    }
    setPaying(true);
    setTimeout(() => {
      const ref = 'CH-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      setRefCode(ref);
      addBooking({ slug: t!.slug, captain: data.captain, partner: data.partner, email: data.email, nat: data.nat, ref });
      setPaying(false);
      setStep(4);
      toast(<>Spot booked · <b>{ref}</b></>);
    }, 1100);
  }

  const pairLabel = data.captain ? `${last(data.captain)} / ${data.partner ? last(data.partner) : '…'}` : 'Your pair';

  return (
    <div className="bg-sand text-ink">
      {/* Header */}
      <div className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          <Image src={t.cover} alt={t.name} fill sizes="100vw" className="object-cover brightness-[0.5] saturate-[1.05]" priority />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,12,0.55),rgba(14,14,12,0.9))]" />
        </div>
        <div className="relative z-[2] mx-auto max-w-[1320px] px-6 pb-6 pt-24 md:pt-28">
          <Link href={`/tournaments/${slug}`} className="mb-[22px] inline-flex items-center gap-[7px] font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/65 transition-colors hover:text-lime">
            ← Back to {t.name}
          </Link>
          <div className="mb-3.5 flex flex-wrap items-center gap-2">
            <TierBadge tier={t.tier} />
            <span className="rounded-full border border-white/25 px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/80">{t.division} Doubles</span>
          </div>
          <h1 className="font-display text-[clamp(26px,3.6vw,42px)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white">Book Your Spot</h1>
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
                  <div key={label} className="relative flex flex-1 flex-col gap-2">
                    {i < STEPS.length - 1 && (
                      <span className={`absolute left-[30px] right-0 top-[15px] h-0.5 ${done ? 'bg-ink' : 'bg-sand-2'}`} />
                    )}
                    <div className={`z-[2] flex h-[30px] w-[30px] items-center justify-center rounded-full font-display text-[13px] font-extrabold ${cur ? 'bg-court-blue text-white' : done ? 'bg-ink text-white' : 'bg-sand-2 text-ink/50'}`}>
                      {done ? '✓' : n}
                    </div>
                    <div className={`font-mono text-[9.5px] font-bold uppercase tracking-[0.08em] ${cur ? 'text-ink' : 'text-ink/45'}`}>{label}</div>
                  </div>
                );
              })}
            </div>

            <div key={step} className="ch-fadein max-w-[620px]">
              {step === 1 && <StepTeam data={data} errors={errors} set={set} onCancel={() => router.push(`/tournaments/${slug}`)} onNext={() => { if (validateTeam()) setStep(2); }} />}
              {step === 2 && <StepReview t={t} data={data} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
              {step === 3 && (
                <StepPayment
                  fee={t.fee}
                  captain={data.captain}
                  method={method}
                  setMethod={setMethod}
                  card={card}
                  setCard={setCard}
                  paying={paying}
                  onBack={() => setStep(2)}
                  onPay={pay}
                />
              )}
              {step === 4 && <StepDone t={t} data={data} refCode={refCode} />}
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="sticky top-[88px] rounded-[22px] bg-ink p-6 text-white">
              <h4 className="mb-4 font-display text-[13px] font-extrabold uppercase text-white/60">Order Summary</h4>
              {[
                ['Tournament', t.name],
                ['Category', `${t.tier} · ${t.division}`],
                ['Dates', t.dates],
                ['Pair', pairLabel],
                ['Entry (1 pair)', `AED ${money(t.fee)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-white/10 py-2.5 text-[13.5px] text-white/75">
                  <span>{k}</span>
                  <b className="max-w-[150px] text-right font-semibold text-white">{v}</b>
                </div>
              ))}
              <div className="mt-1.5 flex items-baseline justify-between pt-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">Total</span>
                <span className="font-display text-[26px] font-black text-lime"><span className="mr-[3px] font-mono text-[12px] text-white/60">AED</span>{money(t.fee)}</span>
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
  return (
    <div>
      <div className={hintCls}>Team Captain (books &amp; pays)</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name"><input className={inputCls(errors.captain)} placeholder="e.g. Omar Al-Falasi" value={data.captain} onChange={(e) => set('captain', e.target.value)} /></Field>
        <Field label="Email"><input type="email" className={inputCls(errors.email)} placeholder="you@email.com" value={data.email} onChange={(e) => set('email', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Mobile"><input className={inputCls(errors.phone)} placeholder="+971 5X XXX XXXX" value={data.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Nationality"><input className={inputCls()} placeholder="e.g. UAE" value={data.nat} onChange={(e) => set('nat', e.target.value)} /></Field>
      </div>
      <Field label="Your level (self-rated)">
        <select className={inputCls()} value={data.level} onChange={(e) => set('level', e.target.value)}>
          <option value="">Select level</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </Field>
      <div className={hintCls}>Playing Partner</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Partner full name"><input className={inputCls(errors.partner)} placeholder="e.g. Ahmed Al-Shamsi" value={data.partner} onChange={(e) => set('partner', e.target.value)} /></Field>
        <Field label="Partner mobile or email"><input className={inputCls()} placeholder="Optional" value={data.pcontact} onChange={(e) => set('pcontact', e.target.value)} /></Field>
      </div>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onCancel} className={btn('ghost')}>Cancel</button>
        <button type="button" onClick={onNext} className={btn('ink', 'flex-1')}>Continue to Review</button>
      </div>
    </div>
  );
}

// ---- Step 2: Review ----
function StepReview({ t, data, onBack, onNext }: { t: { name: string; tier: string; division: string; dates: string; venue: string; fee: number }; data: TeamData; onBack: () => void; onNext: () => void }) {
  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="flex justify-between gap-3 border-b border-ink/10 py-[11px] text-[13.5px] last:border-b-0">
      <span className="text-ink/55">{k}</span>
      <span className="text-right font-semibold text-ink">{v}</span>
    </div>
  );
  return (
    <div>
      <div className="rounded-[22px] border border-ink/10 bg-sand-card p-6">
        <h4 className="mb-4 font-display text-[14px] font-extrabold uppercase">Your Pair</h4>
        <Row k="Captain" v={data.captain} />
        <Row k="Contact" v={`${data.email} · ${data.phone}`} />
        <Row k="Nationality" v={data.nat || '–'} />
        <Row k="Level" v={data.level || '–'} />
        <Row k="Partner" v={data.partner} />
      </div>
      <div className="mt-4 rounded-[22px] border border-ink/10 bg-sand-card p-6">
        <h4 className="mb-4 font-display text-[14px] font-extrabold uppercase">What you&apos;re entering</h4>
        <Row k="Event" v={t.name} />
        <Row k="Category" v={`${t.tier} · ${t.division} Doubles`} />
        <Row k="Dates" v={t.dates} />
        <Row k="Venue" v={t.venue} />
        <Row k="Entry fee" v={`AED ${money(t.fee)}`} />
      </div>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onBack} className={btn('ghost')}>Back</button>
        <button type="button" onClick={onNext} className={btn('ink', 'flex-1')}>Continue to Payment</button>
      </div>
    </div>
  );
}

// ---- Step 3: Demo payment ----
function StepPayment({
  fee,
  captain,
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
  method: string;
  setMethod: (m: string) => void;
  card: { num: string; exp: string; cvc: string; name: string };
  setCard: (c: { num: string; exp: string; cvc: string; name: string }) => void;
  paying: boolean;
  onBack: () => void;
  onPay: () => void;
}) {
  const fmtNum = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
  };
  const fmtCvc = (v: string) => v.replace(/\D/g, '').slice(0, 4);

  return (
    <div>
      <div className="mb-[22px] flex items-center gap-[11px] rounded-xl border border-ink/10 bg-lime/[0.18] px-4 py-3 text-[12.5px] text-ink/70">
        <b className="font-display text-[11px] font-extrabold uppercase tracking-[0.04em]">Demo mode</b>
        This is a sandbox checkout. No payment is taken and no card is charged. Card fields accept any value.
      </div>
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">Choose payment method</p>
      <div className="mb-[22px] flex flex-col gap-2.5">
        {METHODS.map((m) => {
          const on = method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              aria-pressed={on}
              className={`flex items-center gap-3.5 rounded-[14px] border-[1.5px] p-4 text-left transition-colors ${on ? 'border-court-blue bg-court-blue/[0.04]' : 'border-ink/10 bg-sand-card'}`}
            >
              <span className={`relative h-5 w-5 flex-none rounded-full border-2 ${on ? 'border-court-blue' : 'border-ink/25'}`}>
                {on && <span className="absolute inset-1 rounded-full bg-court-blue" />}
              </span>
              <span className="flex h-7 w-[42px] flex-none items-center justify-center rounded-md border border-ink/10 bg-white font-display text-[10px] font-extrabold tracking-[-0.02em] text-ink">{m.icon}</span>
              <span>
                <b className="block font-display text-[14px] font-bold text-ink">{m.name}</b>
                <span className="text-[11.5px] text-ink/50">{m.sub}</span>
              </span>
            </button>
          );
        })}
      </div>

      {method === 'card' && (
        <div>
          <Field label="Card number"><input inputMode="numeric" className={inputCls()} placeholder="4242 4242 4242 4242" value={card.num} onChange={(e) => setCard({ ...card, num: fmtNum(e.target.value) })} /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Expiry"><input className={inputCls()} placeholder="MM / YY" value={card.exp} onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })} /></Field>
            <Field label="CVC"><input inputMode="numeric" className={inputCls()} placeholder="123" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: fmtCvc(e.target.value) })} /></Field>
          </div>
          <Field label="Name on card"><input className={inputCls()} placeholder={captain || 'Full name'} value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} /></Field>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onBack} disabled={paying} className={btn('ghost')}>Back</button>
        <button type="button" onClick={onPay} disabled={paying} className={btn('lime', 'flex-1')}>{paying ? 'Processing…' : `Pay AED ${money(fee)} (Demo)`}</button>
      </div>
    </div>
  );
}

// ---- Step 4: Confirmation ----
function StepDone({ t, data, refCode }: { t: { slug: string; name: string }; data: TeamData; refCode: string }) {
  const { toast } = useTournamentStore();
  return (
    <div className="mx-auto max-w-[560px] rounded-[36px] border border-ink/10 bg-sand-card p-[48px_36px] text-center">
      <div className="mx-auto mb-[22px] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green">
        <svg viewBox="0 0 24 24" className="h-[34px] w-[34px]" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
      </div>
      <h2 className="mb-2.5 font-display text-[30px] font-black uppercase">You&apos;re in!</h2>
      <p className="text-[14.5px] leading-[1.6] text-ink/60"><b className="text-ink">{last(data.captain)} / {last(data.partner)}</b> is registered for</p>
      <p className="mt-1.5 font-display text-[18px] font-extrabold uppercase text-ink">{t.name}</p>
      <div className="my-6 rounded-[14px] bg-ink p-4 font-mono text-white">
        <div className="text-[9px] uppercase tracking-[0.16em] text-white/50">Booking reference</div>
        <div className="mt-1 text-[22px] font-bold tracking-[0.05em]">{refCode}</div>
      </div>
      <p className="text-[13px] text-ink/60">A confirmation would be sent to {data.email}. Your pair now appears in the tournament&apos;s registered teams.</p>
      <div className="mt-[26px] flex flex-wrap justify-center gap-2.5">
        <Link href={`/tournaments/${t.slug}/teams`} className={btn('ink')}>View Registered Teams</Link>
        <button type="button" onClick={() => toast('Calendar invite downloaded (demo)')} className={btn('ghost')}>Add to Calendar</button>
      </div>
    </div>
  );
}
