'use client';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { PointsTable, Tournament } from '@/lib/tournaments/data';
import type { TournamentDetailData } from '@/lib/tournaments/admin-types';
import { useTournamentStore } from '@/lib/tournaments/store';
import ScheduleGrid from './ScheduleGrid';
import StandingsBracket from './StandingsBracket';
import TeamList from './TeamList';
import { StatusPill, TierBadge, CheckIcon, ArrowRightIcon, money, btn } from './ui';

export type DetailTab = 'overview' | 'schedule' | 'teams' | 'standings';

const TABS: { key: DetailTab; label: (t: Tournament) => string }[] = [
  { key: 'overview', label: () => 'Overview' },
  { key: 'schedule', label: () => 'Format & Schedule' },
  { key: 'teams', label: () => 'Teams' },
  { key: 'standings', label: (t) => (t.hasBracket ? 'Standings & Bracket' : 'Standings') },
];

function metaRow(t: Tournament) {
  return [
    { k: 'Dates', v: t.dates },
    { k: 'Venue', v: t.venue },
    { k: 'Format', v: t.format },
    { k: 'Prize Pool', v: `AED ${money(t.prize)}`, lime: true },
    { k: 'Entry / Pair', v: `AED ${money(t.fee)}` },
  ];
}

function PrimaryCta({ t }: { t: Tournament }) {
  const { toast } = useTournamentStore();
  if (t.status === 'open') {
    return (
      <Link href={`/tournaments/${t.slug}/register`} className={btn('lime')}>
        Book Your Spot <ArrowRightIcon />
      </Link>
    );
  }
  if (t.status === 'live') {
    return <Link href={`/tournaments/${t.slug}/standings`} className={btn('lime')}>Follow Live Bracket</Link>;
  }
  if (t.status === 'soon') {
    return (
      <button type="button" onClick={() => toast(<>We&apos;ll notify you when <b>{t.name}</b> opens</>)} className={btn('lime')}>
        Get Notified
      </button>
    );
  }
  return <Link href={`/tournaments/${t.slug}/standings`} className={btn('ghostLight')}>View Results</Link>;
}

function OverviewTab({ t, points }: { t: Tournament; points: PointsTable }) {
  const secondPara =
    t.format === 'Round Robin'
      ? 'Every pair plays every other pair, and final standings decide the winner.'
      : 'The group stage guarantees each pair multiple matches, then the top pairs from each group advance to a single-elimination knockout through to the final.';
  const includes =
    t.fee >= 350
      ? ['Guaranteed group-stage matches', 'Match balls (Head Pro)', 'Court Hub player t-shirt', 'Live scoring & standings', 'Water & courtside recovery', 'Photography & highlights']
      : ['Guaranteed group-stage matches', 'Match balls', 'Live scoring & standings', 'Water station access'];
  const ptsRows: [string, number][] = [
    ['Winner', points.Winner],
    ['Finalist', points.Finalist],
    ['Semifinalist', points.Semifinal],
    ['Quarterfinalist', points.Quarterfinal],
    ['Group stage', points.Group],
  ];

  return (
    <div className="ch-fadein grid grid-cols-1 gap-8 md:grid-cols-[1.6fr_1fr]">
      <div>
        <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">About this event</p>
        <p className="mb-4 max-w-[640px] text-[15px] leading-[1.75] text-ink/70">{t.blurb}</p>
        <p className="mb-4 max-w-[640px] text-[15px] leading-[1.75] text-ink/70">
          This is a {t.tier} category event in the {t.division.toLowerCase()} division, played as fixed pairs. {secondPara} Points earned here roll into the season leaderboard, weighted by category.
        </p>
        <div className="mt-[26px] rounded-[22px] border border-ink/10 bg-sand-card p-6">
          <h4 className="mb-4 font-display text-[14px] font-extrabold uppercase tracking-[-0.01em]">Points on offer ({t.tier})</h4>
          <table className="w-full border-collapse">
            <tbody>
              {ptsRows.map(([label, val], i) => (
                <tr key={label}>
                  <td className={`py-2.5 text-[13.5px] text-ink ${i === ptsRows.length - 1 ? '' : 'border-b border-ink/10'}`}>{label}</td>
                  <td className={`py-2.5 text-right font-display font-extrabold text-court-blue ${i === ptsRows.length - 1 ? '' : 'border-b border-ink/10'}`}>{val} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="rounded-[22px] border border-ink/10 bg-sand-card p-6">
          <h4 className="mb-4 font-display text-[14px] font-extrabold uppercase tracking-[-0.01em]">Key Information</h4>
          {[
            ['Category', t.tier],
            ['Division', `${t.division} Doubles`],
            ['Format', t.format],
            ['Field size', `${t.cap} pairs`],
            ['Registered', `${t.reg} / ${t.cap}`],
            ['Scoring', 'Best of 3 sets'],
          ].map(([k, v], i, arr) => (
            <div key={k} className={`flex justify-between py-[11px] text-[13.5px] ${i === arr.length - 1 ? '' : 'border-b border-ink/10'}`}>
              <span className="text-ink/55">{k}</span>
              <span className="font-semibold text-ink">{v}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[22px] border border-ink/10 bg-sand-card p-6">
          <h4 className="mb-4 font-display text-[14px] font-extrabold uppercase tracking-[-0.01em]">Entry includes</h4>
          <div className="flex flex-col gap-[11px]">
            {includes.map((i) => (
              <div key={i} className="flex items-center gap-[11px] text-[13.5px] text-ink/70">
                <span className="flex-none text-green"><CheckIcon /></span>
                {i}
              </div>
            ))}
          </div>
        </div>

        {t.status === 'open' && (
          <Link href={`/tournaments/${t.slug}/register`} className={btn('ink', 'mt-4 w-full')}>
            Book Your Spot · AED {money(t.fee)}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function TournamentDetail({
  slug,
  tab,
  data,
}: {
  slug: string;
  tab: DetailTab;
  data: TournamentDetailData | null;
}) {
  const { getTournament, pointsFor } = useTournamentStore();
  // Server store is the source of truth; session-created tournaments (public
  // demo admin) resolve from the client store when the server knows nothing.
  const t = data?.tournament ?? getTournament(slug);
  if (!t) notFound();
  const points = data?.points ?? pointsFor(t);

  return (
    <div className="bg-sand text-ink">
      {/* Header */}
      <div className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          <Image src={t.cover} alt={t.name} fill sizes="100vw" className="object-cover brightness-[0.5] saturate-[1.05]" priority />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,12,0.55),rgba(14,14,12,0.9))]" />
        </div>
        <div className="relative z-[2] mx-auto max-w-[1320px] px-6 pb-7 pt-24 md:pt-28">
          <Link href="/tournaments" className="mb-[22px] inline-flex items-center gap-[7px] font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/65 transition-colors hover:text-lime">
            ← All Tournaments
          </Link>
          <div className="mb-3.5 flex flex-wrap items-center gap-2">
            <TierBadge tier={t.tier} />
            <StatusPill status={t.status} />
            <span className="rounded-full border border-white/25 px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/80">
              {t.division} Doubles
            </span>
          </div>
          <h1 className="max-w-[800px] font-display text-[clamp(30px,4.6vw,58px)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white">
            {t.name}
          </h1>
          <div className="mt-5 flex flex-wrap gap-x-[26px] gap-y-4">
            {metaRow(t).map((m) => (
              <div key={m.k} className="flex flex-col gap-[3px]">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">{m.k}</span>
                <span className={`font-display text-[16px] font-bold ${m.lime ? 'text-lime' : 'text-white'}`}>{m.v}</span>
              </div>
            ))}
          </div>
          <div className="mt-[26px] flex flex-wrap gap-3">
            <PrimaryCta t={t} />
          </div>
        </div>
      </div>

      {/* Sticky tab bar. Sits flush under the fixed site header, whose compact
          (scrolled) height is ~80px on mobile and ~84px on desktop. */}
      <div className="sticky top-[80px] z-40 border-b border-ink/10 bg-sand [scrollbar-width:none] md:top-[84px] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex max-w-[1320px] gap-1 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tabDef) => {
            const active = tabDef.key === tab;
            const href = tabDef.key === 'overview' ? `/tournaments/${slug}` : `/tournaments/${slug}/${tabDef.key}`;
            return (
              <Link
                key={tabDef.key}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative whitespace-nowrap px-4 py-4 font-display text-[13.5px] font-bold uppercase tracking-[0.01em] transition-colors ${
                  active ? 'text-ink' : 'text-ink/45 hover:text-ink'
                }`}
              >
                {tabDef.label(t)}
                {active && <span className="absolute inset-x-4 bottom-0 h-[3px] rounded-t bg-lime" />}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-[1320px] px-6 pb-16 pt-10">
        {tab === 'overview' && <OverviewTab t={t} points={points} />}
        {tab === 'schedule' && <ScheduleGrid t={t} schedule={data?.schedule ?? []} />}
        {tab === 'teams' && <TeamList t={t} groups={data?.groups ?? []} teams={data?.teams ?? []} />}
        {tab === 'standings' && <StandingsBracket t={t} groups={data?.groups ?? []} bracket={data?.bracket ?? null} />}
      </div>
    </div>
  );
}
