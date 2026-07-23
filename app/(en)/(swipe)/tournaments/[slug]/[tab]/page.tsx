import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TournamentDetail, { type DetailTab } from '@/components/tournaments/TournamentDetail';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { getDetailData, getTournament } from '@/lib/tournaments/server-store';

// The non-default tabs are real, deep-linkable route segments. Overview lives
// at the bare /tournaments/[slug] route, so it is NOT a valid segment here.
const VALID_TABS = ['schedule', 'teams', 'standings'] as const;

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string; tab: string }> }): Promise<Metadata> {
  const { slug, tab } = await params;
  const t = await getTournament(slug);
  const label = tab.charAt(0).toUpperCase() + tab.slice(1);
  return { title: t ? `${t.name} · ${label} — Court Hub` : 'Tournament — Court Hub' };
}

export default async function Page({ params }: { params: Promise<{ slug: string; tab: string }> }) {
  const { slug, tab } = await params;
  if (!(VALID_TABS as readonly string[]).includes(tab)) notFound();
  const data = await getDetailData(slug);
  return (
    <>
      <HeroFrameNav active="tournaments" fixedBar />
      <TournamentDetail slug={slug} tab={tab as DetailTab} data={data} />
    </>
  );
}
