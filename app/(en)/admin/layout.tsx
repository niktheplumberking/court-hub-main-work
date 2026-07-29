import Link from 'next/link';
import { UserCog } from 'lucide-react';
import LogoutButton from '@/components/admin/LogoutButton';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm-grid-bg min-h-screen bg-ink">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-ink/85 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-display font-black italic uppercase tracking-[0.2em] text-white text-sm">
              COURT <span className="text-lime">HUB</span>
            </Link>
            <span className="font-mono text-[10px] tracking-[0.18em] text-white/50 border border-white/15 rounded-full px-2.5 py-1 uppercase">
              Admin Console
            </span>
          </div>
          <AdminNav />
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
            <span className="adm-live-dot" />
            live
          </span>
          <Link
            href="/admin/account"
            title="My account — change password"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 text-white/50 text-sm hover:border-lime hover:text-lime transition-colors"
          >
            <UserCog className="w-4 h-4" />
            <span className="hidden md:inline">Account</span>
          </Link>
          <LogoutButton />
        </div>
      </nav>
      <div className="px-6 md:px-10 py-10 max-w-[1440px] mx-auto">{children}</div>
    </div>
  );
}
