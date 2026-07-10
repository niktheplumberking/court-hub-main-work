'use client';
import Link from 'next/link';
import { GROUP_A, GROUP_B, type Pair, type Tournament } from '@/lib/tournaments/data';
import { useTournamentStore } from '@/lib/tournaments/store';
import { FmtIcon, btn } from './ui';

function TeamCard({ pair, seed, q = false }: { pair: Pick<Pair, 'name' | 'p1' | 'p2' | 'nat'>; seed: string; q?: boolean }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-ink/10 bg-sand-card p-[16px_18px]">
      <div
        className={`flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] font-display text-[14px] font-extrabold ${
          q ? 'bg-lime text-ink' : 'bg-ink text-white'
        }`}
      >
        {seed}
      </div>
      <div className="min-w-0">
        <b className="block truncate font-display text-[14.5px] font-bold tracking-[-0.01em] text-ink">{pair.name}</b>
        <span className="text-[11.5px] text-ink/50">{pair.p1} · {pair.p2}</span>
      </div>
      <div className="ml-auto font-mono text-[10px] font-bold tracking-[0.1em] text-ink/40">{pair.nat}</div>
    </div>
  );
}

function Group({ label, rows }: { label: string; rows: typeof GROUP_A }) {
  return (
    <div className="mb-[26px]">
      <p className="mb-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">Group {label}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <TeamCard key={r.t.id} pair={r.t} seed={r.q ? 'Q' : ''} q={r.q} />
        ))}
      </div>
    </div>
  );
}

export default function TeamList({ t }: { t: Tournament }) {
  const { bookingsFor } = useTournamentStore();

  if (t.reg === 0) {
    return (
      <div className="ch-fadein py-[70px] text-center text-ink/40">
        <span className="mx-auto mb-3.5 flex w-11 justify-center text-ink/20"><FmtIcon className="h-11 w-11" /></span>
        <b className="block font-display text-[17px] font-extrabold uppercase text-ink/55">No pairs registered yet</b>
        <p className="mt-2">Be the first to enter. Registration is open.</p>
        <Link href={`/tournaments/${t.slug}/register`} className={btn('lime', 'mt-5')}>Book Your Spot</Link>
      </div>
    );
  }

  if (t.slug === 'dubai-open') {
    return (
      <div className="ch-fadein">
        <p className="mb-6 max-w-[600px] text-[14px] text-ink/60">
          Eight pairs, drawn into two groups. <b>Q</b> marks the pairs that advanced to the knockout.
        </p>
        <Group label="A" rows={GROUP_A} />
        <Group label="B" rows={GROUP_B} />
      </div>
    );
  }

  // Generic: session bookings first, then placeholder pairs up to the reg count.
  const booked = bookingsFor(t.slug);
  const bookedPairs = booked.map((b) => ({
    name: `${b.captain.split(' ').pop()} / ${b.partner.split(' ').pop()}`,
    p1: b.captain,
    p2: b.partner,
    nat: b.nat || '–',
  }));
  const fillerCount = Math.max(0, t.reg - bookedPairs.length);
  const filler = Array.from({ length: fillerCount }, (_, i) => ({
    name: `Pair ${bookedPairs.length + i + 1}`,
    p1: 'Registered',
    p2: 'pair',
    nat: '–',
  }));
  const teams = [...bookedPairs, ...filler];

  return (
    <div className="ch-fadein">
      <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">{t.reg} pairs registered</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {teams.map((tm, i) => (
          <TeamCard key={i} pair={tm} seed={String(i + 1)} />
        ))}
      </div>
    </div>
  );
}
