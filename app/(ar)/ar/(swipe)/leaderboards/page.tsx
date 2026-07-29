import Leaderboard from '@/components/tournaments/Leaderboard';
import ComingSoon from '@/components/tournaments/ComingSoon';
import { tournamentsArePublic } from '@/lib/tournaments/flags';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { getLeaderboardRows } from '@/lib/tournaments/server-store';

export const metadata = {
  title: 'ترتيب الموسم — Court Hub',
  description:
    'ترتيب موسم Court Hub 2026: نقاط تراكمية عبر كل فعالية، موزونة حسب الفئة، وقابلة للتصفية حسب القسم.',
  alternates: {
    canonical: '/ar/leaderboards',
    languages: { en: '/leaderboards', ar: '/ar/leaderboards', 'x-default': '/leaderboards' },
  },
};

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
