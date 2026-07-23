'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Division, LeaderboardRow } from '@/lib/tournaments/data';
import { TIER_WEIGHTING_NOTE } from '@/lib/tournaments/points';
import { money, btn, FmtIcon } from './ui';

type DivFilter = 'all' | Division;
const CHIPS: DivFilter[] = ['all', 'Men', 'Women', 'Mixed'];
const PODIUM = ['bg-[linear-gradient(150deg,#b8933e,#e8c766)] text-ink', 'bg-[linear-gradient(150deg,#6c7684,#98a2b0)] text-white', 'bg-[linear-gradient(150deg,#3a3a36,#55554e)] text-white'];

function MvBadge({ mv }: { mv: number }) {
  if (mv > 0) return <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-bold text-green">▲ {mv}</span>;
  if (mv < 0) return <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-bold text-fire">▼ {Math.abs(mv)}</span>;
  return <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-bold text-ink/30">–</span>;
}

export default function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  const [div, setDiv] = useState<DivFilter>('all');

  const list = useMemo(
    () =>
      rows
        .filter((r) => div === 'all' || r.div === div)
        .slice()
        .sort((a, b) => b.pts - a.pts)
        .map((r, i) => ({ ...r, rank: i + 1 })),
    [div, rows],
  );
  const top = list.slice(0, 3);

  return (
    <div className="bg-sand text-ink">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(130%_150%_at_100%_-10%,#1c1c18,#0E0E0C_55%)] px-6 pb-10 pt-28 text-white md:pt-32">
        <div className="mx-auto max-w-[1320px]">
          <p className="mb-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">2026 Season · Cumulative Points</p>
          <h1 className="font-display text-[clamp(38px,6vw,76px)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
            Season <span className="text-lime">Leaderboard</span>
          </h1>
          <p className="mt-3.5 max-w-[520px] text-[15px] leading-relaxed text-white/60">
            Points accumulate across every Court Hub event, weighted by category. A P250 title carries far more than a P25. Standings update as each tournament completes.
          </p>
        </div>
      </section>

      {/* Filter */}
      <div className="mx-auto max-w-[1320px] px-6">
        <div className="-mt-7 flex flex-wrap items-end justify-between gap-4 rounded-[22px] border border-ink/10 bg-sand-card p-[18px]">
          <div>
            <label className="mb-[7px] block font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-ink/45">Division</label>
            <div className="flex flex-wrap gap-[7px]">
              {CHIPS.map((c) => {
                const on = div === c;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDiv(c)}
                    className={`rounded-[10px] border px-[14px] py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition-colors ${on ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-ink/60 hover:border-ink/40'}`}
                  >
                    {c === 'all' ? 'All' : c}
                  </button>
                );
              })}
            </div>
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-ink/45">{TIER_WEIGHTING_NOTE}</span>
        </div>
      </div>

      {/* Body */}
      <section className="px-6 py-[52px]">
        <div className="mx-auto max-w-[1320px]">
          {list.length === 0 ? (
            <div className="py-[70px] text-center text-ink/40">
              <span className="mx-auto mb-3.5 flex w-11 justify-center text-ink/20"><FmtIcon className="h-11 w-11" /></span>
              <b className="block font-display text-[17px] font-extrabold uppercase text-ink/55">No pairs in this division yet</b>
              <p className="mt-2">Standings fill as division events complete.</p>
              <Link href="/tournaments" className={btn('lime', 'mt-[18px]')}>Browse tournaments</Link>
            </div>
          ) : (
            <>
              {/* Podium */}
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {top.map((r, i) => (
                  <div key={r.name} className={`relative flex min-h-[150px] flex-col justify-end gap-1.5 overflow-hidden rounded-[22px] p-6 ${PODIUM[i]}`}>
                    <div className="absolute right-[18px] top-4 font-display text-[44px] font-black opacity-35">{i + 1}</div>
                    <div className="font-display text-[19px] font-extrabold tracking-[-0.02em]">{r.name}</div>
                    <div className="font-mono text-[10px] font-bold tracking-[0.1em] opacity-80">{r.nat} · {r.ev} events · {r.titles} title{r.titles !== 1 ? 's' : ''}</div>
                    <div className="mt-1.5 font-display text-[26px] font-black">{money(r.pts)}<span className="ml-1 font-mono text-[11px] opacity-75">PTS</span></div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse overflow-hidden rounded-[22px] border border-ink/10 bg-sand-card">
                  <thead>
                    <tr>
                      <th className="border-b border-ink/10 p-[14px_12px] text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ink/45">Rank</th>
                      <th className="border-b border-ink/10 p-[14px_12px] text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ink/45">Pair</th>
                      <th className="border-b border-ink/10 p-[14px_12px] text-center font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ink/45">Div</th>
                      <th className="border-b border-ink/10 p-[14px_12px] text-center font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ink/45">Events</th>
                      <th className="border-b border-ink/10 p-[14px_12px] text-center font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ink/45">Titles</th>
                      <th className="border-b border-ink/10 p-[14px_16px_14px_12px] text-right font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ink/45">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r, i) => {
                      const b = i === list.length - 1 ? '' : 'border-b border-ink/10';
                      return (
                        <tr key={r.name} className="hover:bg-ink/[0.02]">
                          <td className={`${b} p-[14px_12px]`}>
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 font-display text-[16px] font-black">{r.rank}</span>
                              <MvBadge mv={r.mv} />
                            </div>
                          </td>
                          <td className={`${b} p-[14px_12px]`}>
                            <b className="font-display text-[14px] font-bold tracking-[-0.01em]">{r.name}</b>
                            <span className="ml-[7px] font-mono text-[10px] text-ink/40">{r.nat}</span>
                          </td>
                          <td className={`${b} p-[14px_12px] text-center font-mono text-[10px] font-bold text-ink/50`}>{r.div.toUpperCase()}</td>
                          <td className={`${b} p-[14px_12px] text-center text-[13.5px] font-semibold`}>{r.ev}</td>
                          <td className={`${b} p-[14px_12px] text-center text-[13.5px] font-semibold`}>{r.titles}</td>
                          <td className={`${b} p-[14px_16px_14px_12px] text-right`}><span className="font-display text-[16px] font-extrabold text-court-blue">{money(r.pts)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
