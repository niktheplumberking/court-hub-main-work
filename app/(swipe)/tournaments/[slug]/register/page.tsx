import { redirect } from 'next/navigation';
import BookingFlow from '@/components/tournaments/BookingFlow';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { getSeedTournament } from '@/lib/tournaments/data';

export const metadata = {
  title: 'Book Your Spot — Court Hub',
  robots: { index: false },
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Booking is only for open events. Seed events get a clean server redirect;
  // session (admin-created) events are validated client-side in BookingFlow.
  const t = getSeedTournament(slug);
  if (t && t.status !== 'open') redirect(`/tournaments/${slug}`);
  return (
    <>
      <HeroFrameNav active="tournaments" fixedBar />
      <BookingFlow slug={slug} />
    </>
  );
}
