'use client';
import { ChevronDown } from 'lucide-react';
import type { Tier, Division, TournamentStatus } from '@/lib/tournaments/data';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { Dict } from '@/lib/i18n/dict';

export type StatusFilter = 'all' | TournamentStatus;
export interface Filters {
  tier: 'all' | Tier;
  div: 'all' | Division;
  status: StatusFilter;
}

const STATUS_CHIPS: { value: StatusFilter; label: (d: Dict['tournaments']) => string }[] = [
  { value: 'all', label: (d) => d.all },
  { value: 'live', label: (d) => d.statusLive },
  { value: 'open', label: (d) => d.statusOpen },
  { value: 'soon', label: (d) => d.statusUpcoming },
  { value: 'done', label: (d) => d.statusCompleted },
];

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-[150px] flex-1">
      <label className="mb-[7px] block font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-ink/45">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-xl border border-ink/10 bg-white px-[14px] py-3 pe-[38px] text-[14px] font-semibold text-ink"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/50" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  const T = useT().tournaments;
  return (
    <div className="relative z-[5] mx-auto -mt-7 flex flex-wrap items-end gap-4 rounded-[22px] border border-ink/10 bg-sand-card p-[18px]">
      <Select label={T.byCategory} value={filters.tier} onChange={(v) => onChange({ ...filters, tier: v as Filters['tier'] })}>
        <option value="all">{T.allCategories}</option>
        <option value="P25">P25</option>
        <option value="P50">P50</option>
        <option value="P100">P100</option>
        <option value="P250">P250</option>
      </Select>

      <Select label={T.byDivision} value={filters.div} onChange={(v) => onChange({ ...filters, div: v as Filters['div'] })}>
        <option value="all">{T.allDivisions}</option>
        <option value="Men">{T.men}</option>
        <option value="Women">{T.women}</option>
        <option value="Mixed">{T.mixed}</option>
      </Select>

      <div className="min-w-[150px] flex-[2]">
        <label className="mb-[7px] block font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-ink/45">{T.byStatus}</label>
        <div className="flex flex-wrap gap-[7px]">
          {STATUS_CHIPS.map((c) => {
            const on = filters.status === c.value;
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ ...filters, status: c.value })}
                className={`rounded-[10px] border px-[14px] py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition-colors ${
                  on ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-ink/60 hover:border-ink/40'
                }`}
              >
                {c.label(T)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
