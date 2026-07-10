import Leaderboard from '@/components/tournaments/Leaderboard';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';

export const metadata = {
  title: 'Season Leaderboard — Court Hub',
  description:
    'The Court Hub 2026 season leaderboard. Cumulative points across every event, weighted by category, filterable by division.',
};

export default function Page() {
  return (
    <>
      <HeroFrameNav fixedBar />
      <Leaderboard />
    </>
  );
}
