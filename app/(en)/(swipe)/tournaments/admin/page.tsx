import TournamentAdmin from '@/components/tournaments/TournamentAdmin';
import ComingSoon from '@/components/tournaments/ComingSoon';
import { tournamentsArePublic } from '@/lib/tournaments/flags';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';

// Demo admin — clearly labelled in-page. Separate from the real e-commerce
// admin at /admin. Noindex: it is an unprotected, non-persistent preview.
export const metadata = {
  title: 'Tournament Admin (Demo) — Court Hub',
  robots: { index: false, follow: false },
};

export default function Page() {
  // Section not public yet (lib/tournaments/flags.ts) — ComingSoon is
  // locale-aware, so /ar visitors get the Arabic version automatically.
  if (!tournamentsArePublic()) return <ComingSoon />;

  return (
    <>
      <HeroFrameNav active="tournaments" fixedBar />
      <TournamentAdmin />
    </>
  );
}
