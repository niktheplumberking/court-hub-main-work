'use client';
import { useActionState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { signIn } from '@/lib/actions/auth';

export default function AdminLogin() {
  // Server-side sign-in (lib/actions/auth.ts): the session cookie is set
  // httpOnly, so no script in the browser can ever read it.
  const [state, action, loading] = useActionState(signIn, null);
  const error = state?.error ?? null;

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

        <form action={action} className="adm-card adm-fade-up w-full p-8 space-y-5">
          <div className="relative">
            <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="Email"
              aria-label="Email"
              className="adm-input adm-input-icon w-full"
            />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              aria-label="Password"
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
