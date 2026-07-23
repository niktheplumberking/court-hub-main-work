import TournamentHub from '@/components/tournaments/TournamentHub';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { getLiveFinal, listTournaments } from '@/lib/tournaments/server-store';

export const metadata = {
  title: 'البطولات — Court Hub',
  description:
    'شارك في بطولات بادل معتمدة من P25 إلى P250 في الإمارات، وتابع المجموعات والجداول مباشرة، وراقب ترتيب موسم Court Hub.',
  alternates: {
    canonical: '/ar/tournaments',
    languages: { en: '/tournaments', ar: '/ar/tournaments', 'x-default': '/tournaments' },
  },
};

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
