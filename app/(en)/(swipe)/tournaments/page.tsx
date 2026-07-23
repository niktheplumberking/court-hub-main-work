import TournamentHub from '@/components/tournaments/TournamentHub';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { getLiveFinal, listTournaments } from '@/lib/tournaments/server-store';

export const metadata = {
  alternates: { canonical: '/tournaments', languages: { en: '/tournaments', ar: '/ar/tournaments', 'x-default': '/tournaments' } },
  title: 'Tournaments — Court Hub',
  description:
    'Enter sanctioned P25 to P250 padel tournaments across the UAE, follow live groups and brackets, and track the Court Hub season leaderboard.',
};

// No hero here — the MAIN project's fixed top navbar (same as Shop), not
// the atif version's nav. Page content ships with pt-28 tops that clear it.
// Reads the live server store (admin edits reflect immediately). Switch to ISR
// (export const revalidate) once the Supabase data layer lands.
export const dynamic = 'force-dynamic';

export default async function Page() {
  const [tournaments, liveFinal] = await Promise.all([listTournaments(), getLiveFinal()]);
  return (
    <>
      <HeroFrameNav active="tournaments" fixedBar />
      <TournamentHub tournaments={tournaments} liveFinal={liveFinal} />
    </>
  );
}
