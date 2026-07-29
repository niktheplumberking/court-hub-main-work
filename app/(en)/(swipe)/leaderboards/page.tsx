import Leaderboard from '@/components/tournaments/Leaderboard';
import ComingSoon from '@/components/tournaments/ComingSoon';
import { tournamentsArePublic } from '@/lib/tournaments/flags';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { getLeaderboardRows } from '@/lib/tournaments/server-store';

export const metadata = {
  alternates: { canonical: '/leaderboards', languages: { en: '/leaderboards', ar: '/ar/leaderboards', 'x-default': '/leaderboards' } },
  title: 'Season Leaderboard — Court Hub',
  description:
    'The Court Hub 2026 season leaderboard. Cumulative points across every event, weighted by category, filterable by division.',
};

// Reads the live server store (admin edits reflect immediately).
export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!tournamentsArePublic()) return <ComingSoon />;

  const rows = await getLeaderboardRows();
  return (
    <>
      <HeroFrameNav active="tournaments" fixedBar />
      <Leaderboard rows={rows} />
    </>
  );
}
