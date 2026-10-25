import { pageMetadata } from '@/lib/seo';
import TournamentHub from '@/components/tournaments/TournamentHub';
import ComingSoon from '@/components/tournaments/ComingSoon';
import { tournamentsArePublic } from '@/lib/tournaments/flags';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { getLiveFinal, listTournaments } from '@/lib/tournaments/server-store';

export const metadata = pageMetadata("/tournaments", "ar", {
  "title": "تحديثات بطولات البادل | Court Hub",
  "description": "تابع تحديثات بطولات البادل لدى Court Hub وتواصل مع فريقنا لمعرفة المزيد عن الفعاليات القادمة في الإمارات.",
  noindex: !tournamentsArePublic(),
});

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!tournamentsArePublic()) return <ComingSoon />;

  const [tournaments, liveFinal] = await Promise.all([listTournaments(), getLiveFinal()]);
  return (
    <>
      <HeroFrameNav active="tournaments" fixedBar />
      <TournamentHub tournaments={tournaments} liveFinal={liveFinal} />
    </>
  );
}
