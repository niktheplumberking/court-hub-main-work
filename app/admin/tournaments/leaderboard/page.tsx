import Link from 'next/link';
import LeaderboardEditor from '@/components/admin/tournaments/LeaderboardEditor';
import { getLeaderboardRows } from '@/lib/tournaments/server-store';

export const dynamic = 'force-dynamic';

export default async function LeaderboardAdminPage() {
  const rows = await getLeaderboardRows();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/tournaments" className="text-white/40 hover:text-lime text-sm">← Tournaments</Link>
        <h1 className="font-display font-bold text-2xl text-white mt-2">
          Season Leaderboard <span className="text-white/30 text-base font-sans font-normal">({rows.length} pairs)</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Edits publish straight to <Link href="/leaderboards" className="underline underline-offset-2 hover:text-lime">/leaderboards</Link>.
        </p>
      </div>
      <LeaderboardEditor rows={rows} />
    </div>
  );
}
