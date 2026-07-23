import Link from 'next/link';
import { deleteTournament } from '@/lib/actions/tournaments';
import { listRegistrations, listTournaments } from '@/lib/tournaments/server-store';
import { ConfirmButton } from '@/components/admin/tournaments/bits';

export const dynamic = 'force-dynamic';

const statusColors: Record<string, string> = {
  live: 'bg-fire/20 text-fire',
  open: 'bg-lime/15 text-lime',
  soon: 'bg-court-blue/20 text-court-blue',
  done: 'bg-white/10 text-white/50',
};
const statusLabels: Record<string, string> = {
  live: 'Live',
  open: 'Open',
  soon: 'Upcoming',
  done: 'Completed',
};

export default async function AdminTournamentsPage() {
  const [tournaments, registrations] = await Promise.all([listTournaments(), listRegistrations()]);
  const regCount = (slug: string) => registrations.filter((r) => r.slug === slug).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display font-bold text-2xl text-white">
          Tournaments <span className="text-white/30 text-base font-sans font-normal">({tournaments.length})</span>
        </h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/tournaments/points" className="px-5 py-2.5 rounded-full border border-white/15 text-white/70 hover:text-lime hover:border-lime/40 font-bold text-sm">
            Points Tables
          </Link>
          <Link href="/admin/tournaments/leaderboard" className="px-5 py-2.5 rounded-full border border-white/15 text-white/70 hover:text-lime hover:border-lime/40 font-bold text-sm">
            Leaderboard
          </Link>
          <Link href="/admin/tournaments/new" className="px-5 py-2.5 rounded-full bg-lime text-ink font-bold text-sm">
            + NEW TOURNAMENT
          </Link>
        </div>
      </div>

      <p className="text-white/30 text-xs bg-ink-2 rounded-xl border border-white/5 px-4 py-3">
        Staging data layer: edits go live on the site immediately but reset on a redeploy or server restart. The dedicated tournaments database is wired in at the final stage.
      </p>

      <div className="bg-ink-2 rounded-[20px] border border-white/5 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/30 text-xs uppercase tracking-wider border-b border-white/5">
              <th className="px-5 py-4">Tournament</th>
              <th className="px-3 py-4">Tier</th>
              <th className="px-3 py-4">Division</th>
              <th className="px-3 py-4">Status</th>
              <th className="px-3 py-4">Dates</th>
              <th className="px-3 py-4">Pairs</th>
              <th className="px-3 py-4">Bookings</th>
              <th className="px-3 py-4">Fee</th>
              <th className="px-3 py-4" />
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => (
              <tr key={t.slug} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-4">
                  <Link href={`/admin/tournaments/${t.slug}`} className="text-white font-semibold hover:text-lime">
                    {t.name}
                  </Link>
                  <p className="text-white/30 text-xs mt-0.5">/{t.slug}</p>
                </td>
                <td className="px-3 py-4 text-white/70">{t.tier}</td>
                <td className="px-3 py-4 text-white/70">{t.division}</td>
                <td className="px-3 py-4">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase ${statusColors[t.status]}`}>
                    {statusLabels[t.status]}
                  </span>
                </td>
                <td className="px-3 py-4 text-white/50">{t.dates}</td>
                <td className="px-3 py-4 text-white/70">{t.reg}/{t.cap}</td>
                <td className="px-3 py-4 text-white/70">{regCount(t.slug)}</td>
                <td className="px-3 py-4 text-white/70">AED {t.fee.toLocaleString('en-US')}</td>
                <td className="px-3 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/tournaments/${t.slug}/manage`} className="text-white/40 hover:text-lime text-xs font-bold whitespace-nowrap">
                      Manage draw
                    </Link>
                    <ConfirmButton
                      action={deleteTournament.bind(null, t.slug)}
                      message={`Delete "${t.name}"? Its groups, bracket, schedule and registrations go with it.`}
                      label={`Delete ${t.name}`}
                      icon
                    />
                  </div>
                </td>
              </tr>
            ))}
            {tournaments.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-white/30">
                  No tournaments. Create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
