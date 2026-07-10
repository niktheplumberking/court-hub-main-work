'use client';
import { useState } from 'react';
import { DXB_GROUPS, type Tournament } from '@/lib/tournaments/data';
import Bracket from './Bracket';
import FinalResultCard from './FinalResultCard';
import GroupTable from './GroupTable';
import { FmtIcon } from './ui';

export default function StandingsBracket({ t }: { t: Tournament }) {
  const [group, setGroup] = useState<'A' | 'B'>('A');

  // Live/full-bracket event (dubai-open): group toggle + tables + knockout.
  if (t.hasBracket) {
    return (
      <div className="ch-fadein">
        <p className="mb-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">Group Stage</p>
        <div className="mb-[18px] flex gap-2">
          {(['A', 'B'] as const).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              onClick={() => setGroup(g)}
              className={`rounded-[10px] border px-4 py-2.5 font-display text-[13px] font-bold uppercase transition-colors ${
                group === g ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-sand-card text-ink/50 hover:text-ink'
              }`}
            >
              Group {g}
            </button>
          ))}
        </div>
        <GroupTable rows={DXB_GROUPS[group]} />
        <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-ink/45">
          <i className="inline-block h-2.5 w-2.5 rounded-[3px] bg-court-blue" /> Top two advance to the knockout
        </div>

        <div className="mt-11">
          <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">
            Knockout Bracket {t.status === 'live' && <span className="text-fire">· Final Live</span>}
          </p>
          <Bracket />
        </div>
      </div>
    );
  }

  // Completed event with a result: the champions card (NOT the Dubai bracket).
  if (t.status === 'done' && t.result) {
    return <FinalResultCard result={t.result} />;
  }

  // Open/upcoming without a bracket yet.
  return (
    <div className="ch-fadein py-[70px] text-center text-ink/40">
      <span className="mx-auto mb-3.5 flex w-11 justify-center text-ink/20"><FmtIcon className="h-11 w-11" /></span>
      <b className="block font-display text-[17px] font-extrabold uppercase text-ink/55">Standings appear once play begins</b>
      <p className="mx-auto mt-2 max-w-[420px]">Group tables and the knockout bracket populate live during the event, then the final result is shown here.</p>
    </div>
  );
}
