import Link from 'next/link';
import { notFound } from 'next/navigation';
import GroupsEditor from '@/components/admin/tournaments/GroupsEditor';
import KnockoutEditor from '@/components/admin/tournaments/KnockoutEditor';
import ScheduleEditor from '@/components/admin/tournaments/ScheduleEditor';
import {
  getGroupsRaw,
  getMatchesRaw,
  getScheduleRaw,
  getTournament,
} from '@/lib/tournaments/server-store';

export const dynamic = 'force-dynamic';

export default async function ManageTournamentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTournament(slug);
  if (!t) notFound();
  const [groups, matches, schedule] = await Promise.all([
    getGroupsRaw(slug),
    getMatchesRaw(slug),
    getScheduleRaw(slug),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/tournaments/${t.slug}`} className="text-white/40 hover:text-lime text-sm">← {t.name}</Link>
        <h1 className="font-display font-bold text-2xl text-white mt-2">Manage Draw</h1>
        <p className="text-white/40 text-sm mt-1">
          Groups, knockout bracket and order of play for <span className="text-white">{t.name}</span>. Everything here renders live on the public tournament page.
        </p>
      </div>

      <GroupsEditor slug={t.slug} groups={groups} />
      <KnockoutEditor slug={t.slug} matches={matches} />
      <ScheduleEditor slug={t.slug} rows={schedule} />
    </div>
  );
}
