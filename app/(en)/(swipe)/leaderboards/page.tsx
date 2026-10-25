import { pageMetadata } from '@/lib/seo';
import Leaderboard from '@/components/tournaments/Leaderboard';
import ComingSoon from '@/components/tournaments/ComingSoon';
import { tournamentsArePublic } from '@/lib/tournaments/flags';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { getLeaderboardRows } from '@/lib/tournaments/server-store';

export const metadata = pageMetadata("/leaderboards", "en", {
  "title": "Padel Leaderboard Updates | Court Hub",
  "description": "Find Court Hub leaderboard updates and follow our padel community in the UAE.",
  noindex: !tournamentsArePublic(),
});

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
