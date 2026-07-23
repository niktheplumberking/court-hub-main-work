'use client';
import type { ScheduleDay, Tournament } from '@/lib/tournaments/data';
import { useT } from '@/lib/i18n/LocaleProvider';
import { CalIcon } from './ui';

export default function ScheduleGrid({ t, schedule }: { t: Tournament; schedule: ScheduleDay[] }) {
  const T = useT().tournaments;
  const hasSched = schedule.length > 0;
  const evState = (s: string) =>
    s === 'live' ? 'border-s-fire' : s === 'done' ? 'border-s-court-blue opacity-60' : 'border-s-court-blue';

  return (
    <div className="ch-fadein">
      <div className="mb-7 max-w-[640px]">
        <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">{T.format}</p>
        <p className="text-[15px] leading-[1.75] text-ink/70">{t.format === 'Round Robin' ? T.formatRoundRobinDesc : T.formatGroupsDesc}</p>
      </div>

      {!hasSched ? (
        <div className="py-[70px] text-center text-ink/40">
          <span className="mx-auto mb-3.5 flex w-11 justify-center text-ink/20"><CalIcon className="h-11 w-11" /></span>
          <b className="block font-display text-[17px] font-extrabold uppercase text-ink/55">{T.scheduleTbc}</b>
          <p className="mx-auto mt-2 max-w-[420px]">{T.scheduleTbcBody}</p>
        </div>
      ) : (
        <>
          <p className="mb-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">{T.orderOfPlay}</p>
          <div className="overflow-hidden rounded-[22px] border border-ink/10 bg-sand-card">
            <div className="grid auto-cols-[minmax(150px,1fr)] grid-flow-col overflow-x-auto">
              {schedule.map((d) => (
                <div key={d.d} className="min-h-[230px] border-s border-ink/10 first:border-s-0">
                  <div className="sticky top-0 border-b border-ink/10 bg-sand-card p-3.5">
                    <b className="font-display text-[22px] font-black text-ink">{d.d}</b>
                    {/* Full sublabel from the data (e.g. "Jul Thu") so any month renders correctly */}
                    <span className="mt-0.5 block font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink/45">{d.dow}</span>
                  </div>
                  {d.evs.map((e, i) => (
                    <div key={i} className={`m-2.5 rounded-xl border border-ink/10 border-s-[3px] bg-white p-3 ${evState(e.s)}`}>
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
