'use client';
import { useMemo, useState } from 'react';
import { STATUS_ORDER } from '@/lib/tournaments/data';
import { useTournamentStore } from '@/lib/tournaments/store';
import FilterBar, { type Filters } from './FilterBar';
import LiveBanner from './LiveBanner';
import TournamentCard from './TournamentCard';
import { CalIcon } from './ui';

export default function TournamentHub() {
  const { allTournaments } = useTournamentStore();
  const [filters, setFilters] = useState<Filters>({ tier: 'all', div: 'all', status: 'all' });

  const all = allTournaments();
  const live = all.find((t) => t.status === 'live');

  const list = useMemo(() => {
    return all
      .filter(
        (t) =>
          (filters.tier === 'all' || t.tier === filters.tier) &&
          (filters.div === 'all' || t.division === filters.div) &&
          (filters.status === 'all' || t.status === filters.status),
      )
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [all, filters]);

  return (
    <div className="bg-sand text-ink">
      {/* Hero — dark gradient, no court-line graphic (removed by request) */}
      <section className="relative overflow-hidden bg-[radial-gradient(130%_150%_at_100%_-10%,#1c1c18,#0E0E0C_55%)] px-6 pb-10 pt-28 text-white md:pt-32">
        <div className="mx-auto max-w-[1320px]">
          <p className="mb-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">Court Hub · Compete</p>
          <h1 className="font-display text-[clamp(38px,6vw,76px)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
            Padel <span className="text-lime">Tournaments</span>
          </h1>
          <p className="mt-3.5 max-w-[520px] text-[15px] leading-relaxed text-white/60">
            Enter sanctioned P25 to P250 events, follow live groups and brackets, and track the season leaderboard. Grab your partner and book your spot on court.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="mx-auto max-w-[1320px] px-6">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {/* Live banner */}
      {live && <LiveBanner t={live} />}

      {/* Grid */}
      <section className="px-6 py-[52px]">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-[26px] flex flex-wrap items-end justify-between gap-5">
            <h2 className="font-display text-[clamp(24px,3.4vw,38px)] font-black uppercase tracking-[-0.03em]">All Tournaments</h2>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">
              {list.length} event{list.length !== 1 ? 's' : ''}
            </p>
          </div>

          {list.length === 0 ? (
            <div className="py-[70px] text-center text-ink/40">
              <span className="mx-auto mb-3.5 flex w-11 justify-center text-ink/20"><CalIcon className="h-11 w-11" /></span>
              <b className="block font-display text-[17px] font-extrabold uppercase text-ink/55">No tournaments match</b>
              <p className="mt-2">Try clearing a filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => (
                <TournamentCard key={t.slug} t={t} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
