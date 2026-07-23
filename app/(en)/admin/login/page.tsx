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
    <main className="min-h-screen bg-ink flex">
      {/* LEFT — brand cover panel */}
      <section className="relative hidden md:flex md:w-[55%] flex-col justify-between overflow-hidden">
        <img
          src="/assets/images/hero_padel_night_view_1779713624496.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/40 to-ink/90" />
        <div className="relative z-10 p-10 lg:p-14">
          <p className="adm-eyebrow">/// COURT HUB ADMIN</p>
          <h1 className="mt-6 font-display font-black uppercase italic text-white text-5xl lg:text-7xl leading-[0.95]">
            RUN THE <span className="text-lime">CLUB</span>
          </h1>
        </div>
        <div className="relative z-10 p-10 lg:p-14 flex items-center gap-3">
          <span className="adm-live-dot" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
            Console online
          </span>
        </div>
      </section>

      {/* RIGHT — login panel */}
      <section className="adm-grid-bg flex flex-1 flex-col items-center justify-center px-6 py-12">
        <form
          onSubmit={submit}
          className="adm-card adm-fade-up w-full max-w-sm p-8 space-y-5"
        >
          <h2 className="font-display font-black uppercase italic tracking-[0.15em] text-white text-center text-xl">
            COURT <span className="text-lime">HUB</span>
          </h2>
          <p className="text-white/40 text-[10px] text-center font-mono uppercase tracking-widest">
            Admin Console
          </p>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="adm-input w-full pl-10"
            />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="adm-input w-full pl-10"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-fire/30 bg-fire/10 px-4 py-3">
              <p className="text-fire text-sm">{error}</p>
            </div>
          )}

          <button
            disabled={loading}
            className="adm-pulse w-full rounded-full bg-lime py-3 font-bold text-ink transition-colors hover:bg-white disabled:opacity-50"
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

        <p className="mt-6 text-[10px] font-mono uppercase tracking-widest text-white/25">
          Court Hub · Premium Padel · Admin
        </p>
      </section>
    </main>
  );
}
