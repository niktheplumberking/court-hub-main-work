'use client';
import { BRACKET, type Match } from '@/lib/tournaments/data';
import { useTournamentStore } from '@/lib/tournaments/store';

function setsWon(a: number[], b: number[]) {
  return a.filter((s, i) => s > b[i]).length;
}

function MatchRow({ name, nat, sets, win, decided, loser }: { name: string; nat: string; sets: number[]; win: boolean; decided: boolean; loser: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 px-[13px] py-[11px] ${loser ? 'opacity-50' : ''}`}>
      <div className={`flex-1 truncate font-display text-[12.5px] font-bold tracking-[-0.01em] ${decided && win ? 'text-ink' : 'text-ink'}`}>
        {name}
        <span className="ml-[5px] font-mono text-[9px] font-bold text-ink/40">{nat}</span>
      </div>
      <div className="flex gap-1">
        {sets.map((s, i) => (
          <b
            key={i}
            className={`flex h-6 w-5 items-center justify-center rounded-[5px] font-display text-[12px] font-extrabold ${
              win && i === sets.length - 1 ? 'bg-lime text-ink' : 'bg-sand-2 text-ink'
            }`}
          >
            {s}
          </b>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ m, champ = false }: { m: Match; champ?: boolean }) {
  const { toast } = useTournamentStore();
  const aw = setsWon(m.sa, m.sb);
  const bw = setsWon(m.sb, m.sa);
  const decided = m.status === 'done';
  const live = m.status === 'live';
  const setsStr = m.sa.map((s, i) => `${s}-${m.sb[i]}`).join(', ');

  return (
    <button
      type="button"
      onClick={() => toast(<>{m.label} · <b>{live ? `LIVE ${setsStr}` : setsStr}</b></>)}
      aria-label={`${m.label}: ${m.a?.name ?? 'TBD'} ${setsStr} ${m.b?.name ?? 'TBD'}`}
      className={`block w-full overflow-hidden rounded-[14px] border bg-sand-card text-left transition-[border-color,box-shadow] duration-200 hover:border-ink/35 hover:shadow-[0_8px_20px_rgba(14,14,12,0.08)] ${
        live ? 'border-fire' : champ ? 'border-2 border-lime' : 'border-ink/10'
      }`}
    >
      <div className="flex justify-between bg-ink/[0.03] px-[13px] py-1.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] text-ink/45">
        <span>{m.label}</span>
        <span>{live ? <span className="text-fire">● LIVE</span> : m.time}</span>
      </div>
      <MatchRow name={m.a?.name ?? 'TBD'} nat={m.a?.nat ?? ''} sets={m.sa} win={decided && aw > bw} decided={decided} loser={decided && aw < bw} />
      <div className="border-t border-ink/10" />
      <MatchRow name={m.b?.name ?? 'TBD'} nat={m.b?.nat ?? ''} sets={m.sb} win={decided && bw > aw} decided={decided} loser={decided && bw < aw} />
    </button>
  );
}

export default function Bracket() {
  return (
    <div className="flex gap-9 overflow-x-auto px-0.5 pb-5 pt-2">
      <div className="flex min-w-[230px] flex-col justify-center gap-[22px]">
        <div className="mb-0.5 text-center font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-ink/40">Semifinals</div>
        <MatchCard m={BRACKET.sf[0]} />
        <MatchCard m={BRACKET.sf[1]} />
      </div>
      <div className="flex min-w-[230px] flex-col justify-center gap-[22px]">
        <div>
          <div className="mb-0.5 text-center font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-ink/40">Final</div>
          <MatchCard m={BRACKET.final} champ />
        </div>
        <div>
          <div className="mb-0.5 text-center font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-ink/40">3rd Place</div>
          <MatchCard m={BRACKET.third} />
        </div>
      </div>
    </div>
  );
}
