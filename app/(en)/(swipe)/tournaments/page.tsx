import { pageMetadata } from '@/lib/seo';
import TournamentHub from '@/components/tournaments/TournamentHub';
import ComingSoon from '@/components/tournaments/ComingSoon';
import { tournamentsArePublic } from '@/lib/tournaments/flags';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { getLiveFinal, listTournaments } from '@/lib/tournaments/server-store';

export const metadata = pageMetadata("/tournaments", "en", {
  "title": "Padel Tournament Updates | Court Hub",
  "description": "Follow Court Hub tournament updates. Contact our team for information about future padel events in the UAE.",
  noindex: !tournamentsArePublic(),
});

// No hero here — the MAIN project's fixed top navbar (same as Shop), not
// the atif version's nav. Page content ships with pt-28 tops that clear it.
// Reads the live server store (admin edits reflect immediately). Switch to ISR
// (export const revalidate) once the Supabase data layer lands.
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
