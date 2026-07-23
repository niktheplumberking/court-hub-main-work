'use client';
import { useState } from 'react';
import type { Bracket as BracketData, GroupStanding, Tournament } from '@/lib/tournaments/data';
import Bracket from './Bracket';
import FinalResultCard from './FinalResultCard';
import GroupTable from './GroupTable';
import { FmtIcon } from './ui';

export default function StandingsBracket({
  t,
  groups,
  bracket,
}: {
  t: Tournament;
  groups: { label: string; rows: GroupStanding[] }[];
  bracket: BracketData | null;
}) {
  const [gi, setGi] = useState(0);
  const active = groups[Math.min(gi, Math.max(0, groups.length - 1))];

  // Live standings: any group tables and/or a knockout bracket the admin has set up.
  if (groups.length > 0 || bracket) {
    return (
      <div className="ch-fadein">
        {groups.length > 0 && (
          <>
            <p className="mb-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">Group Stage</p>
            <div className="mb-[18px] flex flex-wrap gap-2">
              {groups.map((g, i) => (
                <button
                  key={g.label}
                  type="button"
                  aria-pressed={gi === i}
                  onClick={() => setGi(i)}
                  className={`rounded-[10px] border px-4 py-2.5 font-display text-[13px] font-bold uppercase transition-colors ${
                    gi === i ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-sand-card text-ink/50 hover:text-ink'
                  }`}
                >
                  Group {g.label}
                </button>
              ))}
            </div>
            {active && <GroupTable rows={active.rows} />}
            <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-ink/45">
              <i className="inline-block h-2.5 w-2.5 rounded-[3px] bg-court-blue" /> Top two advance to the knockout
            </div>
          </>
        )}

        {bracket && (
          <div className={groups.length > 0 ? 'mt-11' : ''}>
            <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">
              Knockout Bracket {t.status === 'live' && <span className="text-fire">· Final Live</span>}
            </p>
            <Bracket bracket={bracket} />
          </div>
        )}
      </div>
    );
  }

  // Completed event with a result: the champions card (NOT a bracket).
  if (t.status === 'done' && t.result) {
    return <FinalResultCard result={t.result} />;
  }

  // Open/upcoming without standings yet.
  return (
    <div className="ch-fadein py-[70px] text-center text-ink/40">
      <span className="mx-auto mb-3.5 flex w-11 justify-center text-ink/20"><FmtIcon className="h-11 w-11" /></span>
      <b className="block font-display text-[17px] font-extrabold uppercase text-ink/55">Standings appear once play begins</b>
      <p className="mx-auto mt-2 max-w-[420px]">Group tables and the knockout bracket populate live during the event, then the final result is shown here.</p>
    </div>
  );
}
