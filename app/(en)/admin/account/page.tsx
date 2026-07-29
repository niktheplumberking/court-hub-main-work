import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { supabaseServer } from '@/lib/supabase/server';
import ChangePasswordForm from '@/components/admin/ChangePasswordForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'My Account — Court Hub Admin', robots: { index: false } };

/**
 * Account screen — lets an admin change their OWN password. Essential at
 * handover: the owner receives a temporary password, signs in, and
 * immediately replaces it with a secret nobody else knows.
 */
export default async function AccountPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-xl">
      <Link href="/admin" className="text-white/40 hover:text-lime text-sm inline-flex items-center gap-2 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <p className="adm-eyebrow mb-2">/// Account</p>
      <h1 className="font-display font-black italic uppercase tracking-[0.06em] text-3xl md:text-4xl text-white mb-8">
        My Account
      </h1>

      <div className="adm-card p-6 mb-6">
        <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Signed in as</p>
        <p className="text-white font-mono text-sm break-all">{user?.email ?? 'unknown'}</p>
      </div>

      <div className="adm-card p-6 space-y-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-lime shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display font-bold text-white text-lg">Change your password</h2>
            <p className="text-white/45 text-sm mt-1">
              Pick something only you know, at least 8 characters. You stay signed in on this device.
            </p>
          </div>
        </div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
