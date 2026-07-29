'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Mail, Lock } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    // Deliberately plain: one centered card, no cover imagery. The console is a
    // tool, not a landing page — and it loads instantly on any connection.
    <main className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display font-black uppercase italic tracking-[0.15em] text-white text-2xl">
            COURT <span className="text-lime">HUB</span>
          </p>
          <p className="text-white/40 text-[10px] mt-2 font-mono uppercase tracking-widest">
            Admin Console
          </p>
        </div>

        <form onSubmit={submit} className="adm-card adm-fade-up w-full p-8 space-y-5">
          <div className="relative">
            <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="adm-input adm-input-icon w-full"
            />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="adm-input adm-input-icon w-full"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-fire/30 bg-fire/10 px-4 py-3">
              <p className="text-fire text-sm">{error}</p>
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-full bg-lime py-3 font-bold text-ink transition-colors hover:brightness-110 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                Signing in…
              </span>
            ) : (
              'SIGN IN'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[10px] font-mono uppercase tracking-widest text-white/25">
          Court Hub · Premium Padel · Admin
        </p>
      </div>
    </main>
  );
}
