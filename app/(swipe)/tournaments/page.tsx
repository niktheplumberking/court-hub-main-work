import TournamentHub from '@/components/tournaments/TournamentHub';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';

export const metadata = {
  title: 'Tournaments — Court Hub',
  description:
    'Enter sanctioned P25 to P250 padel tournaments across the UAE, follow live groups and brackets, and track the Court Hub season leaderboard.',
};

// No hero here — the MAIN project's fixed top navbar (same as Shop), not
// the atif version's nav. Page content ships with pt-28 tops that clear it.
export default function Page() {
  return (
    <>
      <HeroFrameNav fixedBar />
      <TournamentHub />
    </>
  );
}
