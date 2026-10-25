import { pageMetadata } from '@/lib/seo';
import Leaderboard from '@/components/tournaments/Leaderboard';
import ComingSoon from '@/components/tournaments/ComingSoon';
import { tournamentsArePublic } from '@/lib/tournaments/flags';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { getLeaderboardRows } from '@/lib/tournaments/server-store';

export const metadata = pageMetadata("/leaderboards", "ar", {
  "title": "تحديثات ترتيب لاعبي البادل | Court Hub",
  "description": "تعرف على تحديثات ترتيب لاعبي البادل وتابع مجتمع Court Hub في الإمارات.",
  noindex: !tournamentsArePublic(),
});

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
