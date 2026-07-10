import Image from 'next/image';
import Link from 'next/link';
import { BRACKET, type Pair, type Tournament } from '@/lib/tournaments/data';
import { StatusPill, TierBadge, money, btn } from './ui';

function ScoreRow({ team, my, opp }: { team: Pair; my: number[]; opp: number[] }) {
  const win = my.filter((s, i) => s > opp[i]).length > opp.filter((s, i) => s > my[i]).length;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 font-display text-[14.5px] font-bold text-white">
        <span className="flex h-[15px] w-[22px] items-center justify-center rounded-[3px] bg-white/10 font-mono text-[9px] text-white/70">
          {team.nat}
        </span>
        {team.name}
      </div>
      <div className="flex gap-1.5">
        {my.map((s, i) => (
          <b
            key={i}
            className={`flex h-[30px] w-[26px] items-center justify-center rounded-[7px] font-display text-[15px] font-extrabold ${
              win && i === my.length - 1 ? 'bg-lime text-ink' : 'bg-white/10 text-white'
            }`}
          >
            {s}
          </b>
        ))}
      </div>
    </div>
  );
}

export default function LiveBanner({ t }: { t: Tournament }) {
  const f = BRACKET.final;
  if (!f.a || !f.b) return null;
  return (
    <section className="pb-0 pt-[34px]">
      <div className="mx-auto max-w-[1320px] px-6">
        <div className="relative grid overflow-hidden rounded-[36px] border border-white/[0.06] bg-[linear-gradient(120deg,#0E0E0C_0%,#161613_100%)] md:grid-cols-[1.15fr_1fr]">
          <div className="relative min-h-[180px] md:min-h-[300px]">
            <Image src={t.cover} alt={t.name} fill sizes="(max-width:820px) 100vw, 55vw" className="object-cover brightness-[0.7] saturate-[1.1]" />
            {/* Fade into the body (bottom on mobile, right on desktop) */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,#0E0E0C_100%)] md:bg-[linear-gradient(90deg,transparent_40%,#0E0E0C_100%)]" />
          </div>
          <div className="relative z-[2] flex flex-col justify-center gap-4 p-[38px_28px] md:p-[38px_40px]">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status="live" />
              <TierBadge tier={t.tier} />
              <span className="rounded-full border border-white/25 px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/80">
                {t.division}
              </span>
            </div>
            <h3 className="font-display text-[clamp(26px,3vw,40px)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white">
              {t.name}
            </h3>
            <p className="-mt-1 text-[13px] text-white/60">Final in progress · {f.court}</p>
            <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-[16px_18px]">
              <ScoreRow team={f.a} my={f.sa} opp={f.sb} />
              <ScoreRow team={f.b} my={f.sb} opp={f.sa} />
            </div>
            <div className="mt-1.5 flex gap-2.5">
              <Link href={`/tournaments/${t.slug}/standings`} className={btn('lime', '', true)}>View Bracket</Link>
              <Link href={`/tournaments/${t.slug}`} className={btn('ghostLight', '', true)}>Tournament Hub</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
