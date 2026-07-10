import type { Metadata } from 'next';
import TournamentDetail from '@/components/tournaments/TournamentDetail';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { TOURNAMENTS, getSeedTournament } from '@/lib/tournaments/data';

// Prerender the seed tournaments; session (admin-created) slugs still resolve
// on the client via the store (soft navigation).
export function generateStaticParams() {
  return TOURNAMENTS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = getSeedTournament(slug);
  return {
    title: t ? `${t.name} — Court Hub` : 'Tournament — Court Hub',
    description: t?.blurb,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Bare route renders the default Overview tab (main project's fixed navbar).
  return (
    <>
      <HeroFrameNav active="tournaments" fixedBar />
      <TournamentDetail slug={slug} tab="overview" />
    </>
  );
}
