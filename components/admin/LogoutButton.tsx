'use client';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await supabaseBrowser().auth.signOut();
        router.push('/admin/login');
        router.refresh();
      }}
      className="px-4 py-1.5 rounded-full border border-white/15 text-white/40 text-sm hover:border-fire hover:text-fire transition-colors"
    >
      Sign out
    </button>
  );
}
