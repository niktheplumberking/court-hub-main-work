'use client';
import Link from 'next/link';
import { CalendarClock, MessageCircle } from 'lucide-react';
import { useLocalePath, useT } from '@/lib/i18n/LocaleProvider';
import { waHref } from '@/lib/whatsapp';

/**
 * Placeholder for the tournaments section while it is not public yet
 * (see lib/tournaments/flags.ts). Deliberately a real, branded page rather
 * than a 404: the nav links stay valid and it collects interested players
 * on WhatsApp instead of losing them.
 */
export default function ComingSoon() {
  const t = useT();
  const lp = useLocalePath();

  return (
    <main className="min-h-screen bg-ink text-white flex items-center justify-center px-6 pt-28 pb-20">
      <div className="max-w-xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-lime">
          <CalendarClock className="w-3.5 h-3.5" />
          {t.tournaments.kicker}
        </span>

        <h1 className="mt-8 font-display font-black uppercase italic tracking-tight text-5xl md:text-7xl leading-[0.95]">
          {t.tournaments.hubTitle}
          <span className="block text-lime">{t.tournaments.comingSoonHeadline}</span>
        </h1>

        <p className="mt-6 text-white/55 text-base md:text-lg leading-relaxed">
          {t.tournaments.comingSoonBody}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={waHref(t.tournaments.comingSoonWa)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-lime px-7 py-3.5 font-sans text-xs font-bold uppercase tracking-widest text-ink shadow-md transition-colors hover:bg-white"
          >
            <MessageCircle className="w-4 h-4" />
            {t.tournaments.comingSoonCta}
          </a>
          <Link
            href={lp('/')}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 font-sans text-xs font-bold uppercase tracking-widest text-white/70 transition-colors hover:border-white/50 hover:text-white"
          >
            {t.tournaments.comingSoonBack}
          </Link>
        </div>
      </div>
    </main>
  );
}
