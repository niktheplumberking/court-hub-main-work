import Link from 'next/link';
import TierPointsEditor from '@/components/admin/tournaments/TierPointsEditor';
import { getTierPointsMap } from '@/lib/tournaments/server-store';

export const dynamic = 'force-dynamic';

export default async function PointsPage() {
  const points = await getTierPointsMap();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/tournaments" className="text-white/40 hover:text-lime text-sm">← Tournaments</Link>
        <h1 className="font-display font-bold text-2xl text-white mt-2">Points Tables</h1>
        <p className="text-white/40 text-sm mt-1">
          Points awarded per finishing position, by category. Shown on every tournament overview and feeds the season leaderboard weighting.
        </p>
      </div>
      <TierPointsEditor points={points} />
    </div>
  );
}
