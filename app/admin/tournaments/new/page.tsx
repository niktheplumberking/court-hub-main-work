import Link from 'next/link';
import TournamentForm from '@/components/admin/tournaments/TournamentForm';

export const dynamic = 'force-dynamic';

export default function NewTournamentPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/tournaments" className="text-white/40 hover:text-lime text-sm">← Tournaments</Link>
        <h1 className="font-display font-bold text-2xl text-white mt-2">New Tournament</h1>
      </div>
      <TournamentForm />
    </div>
  );
}
