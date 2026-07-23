import Link from 'next/link';
import { notFound } from 'next/navigation';
import TournamentForm from '@/components/admin/tournaments/TournamentForm';
import RegistrationsList from '@/components/admin/tournaments/RegistrationsList';
import { getTournament, listRegistrations } from '@/lib/tournaments/server-store';

export const dynamic = 'force-dynamic';

export default async function EditTournamentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [t, registrations] = await Promise.all([getTournament(slug), listRegistrations(slug)]);
  if (!t) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/tournaments" className="text-white/40 hover:text-lime text-sm">← Tournaments</Link>
          <h1 className="font-display font-bold text-2xl text-white mt-2">{t.name}</h1>
          <p className="text-white/30 text-xs mt-1">
            Public page: <Link href={`/tournaments/${t.slug}`} className="hover:text-lime underline underline-offset-2">/tournaments/{t.slug}</Link>
          </p>
        </div>
        <Link href={`/admin/tournaments/${t.slug}/manage`} className="px-5 py-2.5 rounded-full bg-court-blue text-white font-bold text-sm">
          Manage groups, bracket &amp; schedule →
        </Link>
      </div>

      <TournamentForm tournament={t} />

      <div className="space-y-4">
        <h2 className="font-display font-bold text-xl text-white">
          Registrations &amp; Payments <span className="text-white/30 text-base font-sans font-normal">({registrations.length})</span>
        </h2>
        <RegistrationsList registrations={registrations} />
      </div>
    </div>
  );
}
