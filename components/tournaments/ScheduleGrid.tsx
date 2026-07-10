import { SCHEDULE_DXB, type Tournament } from '@/lib/tournaments/data';
import { CalIcon } from './ui';

const GROUPS_KNOCKOUT =
  'This event runs as a group stage into a knockout. Pairs are drawn into groups of four and play a round-robin within the group. The top two from each group advance to the single-elimination knockout, cross-seeded so group winners meet group runners-up in the semifinals, through to the final.';
const ROUND_ROBIN =
  'This event runs as a single round-robin. Every pair plays every other pair once, and the pair with the best record tops the table. Matches are single sets to keep the evening moving.';

export default function ScheduleGrid({ t }: { t: Tournament }) {
  const hasSched = t.slug === 'dubai-open';
  const evState = (s: string) =>
    s === 'live' ? 'border-l-fire' : s === 'done' ? 'border-l-court-blue opacity-60' : 'border-l-court-blue';

  return (
    <div className="ch-fadein">
      <div className="mb-7 max-w-[640px]">
        <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">Format</p>
        <p className="text-[15px] leading-[1.75] text-ink/70">{t.format === 'Round Robin' ? ROUND_ROBIN : GROUPS_KNOCKOUT}</p>
      </div>

      {!hasSched ? (
        <div className="py-[70px] text-center text-ink/40">
          <span className="mx-auto mb-3.5 flex w-11 justify-center text-ink/20"><CalIcon className="h-11 w-11" /></span>
          <b className="block font-display text-[17px] font-extrabold uppercase text-ink/55">Schedule to be confirmed</b>
          <p className="mx-auto mt-2 max-w-[420px]">The full day-by-day order of play is published once the draw is finalised, typically the day before the event.</p>
        </div>
      ) : (
        <>
          <p className="mb-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">Order of play</p>
          <div className="overflow-hidden rounded-[22px] border border-ink/10 bg-sand-card">
            <div className="grid auto-cols-[minmax(150px,1fr)] grid-flow-col overflow-x-auto">
              {SCHEDULE_DXB.map((d) => (
                <div key={d.d} className="min-h-[230px] border-l border-ink/10 first:border-l-0">
                  <div className="sticky top-0 border-b border-ink/10 bg-sand-card p-3.5">
                    <b className="font-display text-[22px] font-black text-ink">{d.d}</b>
                    <span className="mt-0.5 block font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink/45">Jul {d.dow}</span>
                  </div>
                  {d.evs.map((e, i) => (
                    <div key={i} className={`m-2.5 rounded-xl border border-ink/10 border-l-[3px] bg-white p-3 ${evState(e.s)}`}>
                      <div className="font-mono text-[9px] font-bold tracking-[0.08em] text-ink/50">{e.t}</div>
                      <div className="my-[3px] mt-[5px] font-display text-[12.5px] font-bold tracking-[-0.01em] text-ink">{e.n}</div>
                      <div className="text-[10.5px] text-ink/50">{e.v}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
