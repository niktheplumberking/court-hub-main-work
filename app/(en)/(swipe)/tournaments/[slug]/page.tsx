import type { Metadata } from 'next';
import ComingSoon from '@/components/tournaments/ComingSoon';
import { tournamentsArePublic } from '@/lib/tournaments/flags';
import TournamentDetail from '@/components/tournaments/TournamentDetail';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { getDetailData, getTournament } from '@/lib/tournaments/server-store';

// Reads the live server store so admin edits show immediately; also lets
// admin-created slugs resolve. Switch to ISR when Supabase lands.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTournament(slug);
  return {
    title: t ? `${t.name} — Court Hub` : 'Tournament — Court Hub',
    description: t?.blurb,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  // Section not public yet (lib/tournaments/flags.ts) — ComingSoon is
  // locale-aware, so /ar visitors get the Arabic version automatically.
  if (!tournamentsArePublic()) return <ComingSoon />;

  const { slug } = await params;
  const data = await getDetailData(slug);
  // Bare route renders the default Overview tab (main project's fixed navbar).
  // `data` is null for slugs that only exist in the client session store
  // (public demo admin) - the client component falls back to that store
  // before 404ing.
  return (
    <>
      <HeroFrameNav active="tournaments" fixedBar />
      <TournamentDetail slug={slug} tab="overview" data={data} />
    </>
  );
}
