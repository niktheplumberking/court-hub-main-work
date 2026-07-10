import TournamentAdmin from '@/components/tournaments/TournamentAdmin';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';

// Demo admin — clearly labelled in-page. Separate from the real e-commerce
// admin at /admin. Noindex: it is an unprotected, non-persistent preview.
export const metadata = {
  title: 'Tournament Admin (Demo) — Court Hub',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <HeroFrameNav active="tournaments" fixedBar />
      <TournamentAdmin />
    </>
  );
}
