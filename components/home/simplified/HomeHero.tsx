'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { useMouseParallax } from '@/components/shared/useMouseParallax';
import { useLocalePath, useT } from '@/lib/i18n/LocaleProvider';
import TennisBall from '@/components/shared/TennisBall';
import HeroRackets from './HeroRackets';
import type { ContentMap } from '@/lib/content/get';
import type { HeroRacket } from '@/lib/shop/hero-rackets';

// Decorative balls floating over the turf: [inline-start %, top %, size px, float seconds, delay s]
const BALLS: [number, number, number, number, number][] = [
  [3, 62, 34, 6.5, 0],
  [8, 84, 22, 5.2, 1.1],
  [46, 88, 28, 7.2, 0.4],
  [63, 24, 18, 5.8, 2],
  [92, 70, 26, 6.8, 0.8],
  [96, 30, 16, 5, 1.6],
];

function Racket({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 200" className={className} style={style} aria-hidden>
      <ellipse cx="60" cy="68" rx="52" ry="62" fill="rgba(31,95,214,0.55)" stroke="rgba(156,195,255,0.9)" strokeWidth="5" />
      {[[42, 44], [60, 40], [78, 44], [48, 64], [72, 64], [60, 84], [42, 88], [78, 88]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="rgba(156,195,255,0.75)" />
      ))}
      <rect x="52" y="126" width="16" height="66" rx="8" fill="rgba(156,195,255,0.8)" />
    </svg>
  );
}

/**
 * Home hero — rebuilt on the client's own concept (his Oct 2026 artifact):
 * a bright court-blue hero with the business laid out on a top-down padel
 * court (Tournaments · Courts · Shop zones, clickable), floating balls and
 * rackets with mouse parallax, and the rotating headline the client asked
 * for. Keeps the framed mock-up + in-frame navbar shared by every page hero.
 * (The old night-courts photo field stays in the CMS but is no longer used.)
 */
export default function HomeHero({ content, heroRackets }: { content: ContentMap; heroRackets: HeroRacket[] }) {
  const { x: parallaxX, y: parallaxY } = useMouseParallax(22);
  const lp = useLocalePath();
  const t = useT();

  // Rotating headline (client request): the four promises of Court Hub cycle
  // in place. Every phrase is editable in the Studio (home.hero.*). Driven by
  // CSS keyframes + a timer, not Framer, so it keeps running under the OS
  // "reduce motion" setting (Framer freezes loops there).
  const phrases = [
    [content['home.hero.title_line1'], content['home.hero.title_line2']],
    [content['home.hero.rotate2_line1'], content['home.hero.rotate2_line2']],
    [content['home.hero.rotate3_line1'], content['home.hero.rotate3_line2']],
    [content['home.hero.rotate4_line1'], content['home.hero.rotate4_line2']],
  ].filter(([a, b]) => a || b);
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (phrases.length < 2) return;
    let swap: number | undefined;
    const tick = window.setInterval(() => {
      setLeaving(true);
      swap = window.setTimeout(() => {
        setIdx((i) => (i + 1) % phrases.length);
        setLeaving(false);
      }, 520);
    }, 3600);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(swap);
    };
  }, [phrases.length]);
  const [line1, line2] = phrases[idx] ?? ['', ''];

  return (
    <section
      data-cms="home:hero"
      className="ch-rail-exempt ch-dark relative min-h-[100dvh] w-full p-2 sm:p-5 md:p-6 lg:p-8 overflow-hidden"
    >
      {/* Turf: court-blue light falloff + mowing stripes + faint court grid */}
      <div aria-hidden className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(120%_95%_at_85%_0%,#5AA2F2_0%,#3D8DEB_28%,#1F5FD6_60%,#133F9F_100%)]" />
        <div className="absolute inset-0 opacity-70 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.045)_0_90px,transparent_90px_180px)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]" />
        <div className="absolute -bottom-40 -start-40 w-[620px] h-[620px] rounded-full bg-[radial-gradient(circle,rgba(216,240,60,0.10),transparent_65%)]" />
      </div>

      {/* Floating balls + rackets (parallax layer) */}
      <motion.div aria-hidden style={{ x: parallaxX, y: parallaxY }} className="absolute inset-0 z-[1] pointer-events-none">
        {BALLS.map(([s, top, size, dur, delay], i) => (
          <TennisBall
            key={i}
            className={`ch-floaty absolute drop-shadow-[0_8px_14px_rgba(6,26,68,0.35)] ${i === 1 || i === 2 ? "hidden md:block" : ""}`}
            style={{ insetInlineStart: `${s}%`, top: `${top}%`, width: size, height: size, animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
          />
        ))}
        <Racket className="ch-floaty absolute hidden md:block w-[110px] -rotate-[24deg] opacity-80" style={{ top: '16%', insetInlineEnd: '3%', animationDuration: '8s' }} />
        <Racket className="ch-floaty absolute hidden md:block w-[76px] rotate-[18deg] opacity-70" style={{ bottom: '9%', insetInlineStart: '38%', animationDuration: '9s', animationDelay: '1.2s' }} />
      </motion.div>

      <div className="relative z-10 w-full min-h-[calc(100dvh-1rem)] sm:min-h-[calc(100dvh-2.5rem)] md:min-h-[calc(100dvh-3rem)] lg:min-h-[calc(100dvh-4rem)] max-w-[1720px] mx-auto flex">
        <div className="w-full border-2 md:border-[3px] border-white/55 rounded-[28px] sm:rounded-[36px] md:rounded-[44px] relative shadow-[0_32px_120px_rgba(6,26,68,0.45)] bg-white/[0.04] flex flex-col p-3 pb-8 sm:p-8 md:p-10 lg:p-12">
          <HeroFrameNav active="home" />

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] items-center gap-8 lg:gap-10 pt-16 md:pt-8 lg:pt-4">
            {/* Copy */}
            <div className="text-center lg:text-start flex flex-col items-center lg:items-start">
              <h1
                aria-label={phrases.map((p) => p.filter(Boolean).join(' ')).join(' · ')}
                className="w-full flex flex-col items-center lg:items-start font-display font-black text-[40px] sm:text-[64px] lg:text-[80px] xl:text-[100px] leading-[0.86] tracking-tighter uppercase select-none min-h-[1.9em]"
              >
                <span aria-hidden key={`a${idx}`} className={`ch-rot-line block text-white drop-shadow-[0_8px_18px_rgba(6,26,68,0.35)] ${leaving ? 'is-leaving' : ''}`}>
                  {line1}
                </span>
                <span aria-hidden key={`b${idx}`} className={`ch-rot-line ch-rot-line--2 ch-rot-ball block mt-1 sm:mt-2 ${leaving ? 'is-leaving' : ''}`}>
                  {line2}
                </span>
              </h1>
              {phrases.length > 1 && (
                <div aria-hidden className="mt-5 flex items-center gap-2">
                  {phrases.map((_, i) => (
                    <span key={i} className={`ch-rot-dash ${i === idx ? 'is-active' : ''}`}>
                      {i === idx && <span key={idx} className="ch-rot-dash-fill" />}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-6 max-w-lg text-white/85 text-sm sm:text-base font-medium leading-relaxed">
                {content['home.hero.paragraph']}
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <Link
                  href={lp('/construct-your-court')}
                  className="px-7 py-3.5 bg-white text-ink font-display text-[12px] sm:text-[13px] font-extrabold uppercase tracking-[0.12em] rounded-full shadow-[0_14px_30px_-10px_rgba(6,26,68,0.55)] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-10px_rgba(6,26,68,0.6)] transition-all duration-300"
                >
                  {content['home.hero.cta_primary']}
                </Link>
                <Link
                  href={lp('/shop')}
                  className="px-7 py-3.5 border-2 border-white/60 text-white font-display text-[12px] sm:text-[13px] font-extrabold uppercase tracking-[0.12em] rounded-full hover:bg-white/10 hover:border-white transition-colors duration-300"
                >
                  {content['home.hero.cta_secondary']}
                </Link>
              </div>
            </div>

            {/* Best-selling rackets in 3D (client request, Oct 2026) */}
            <div className="flex justify-center lg:justify-end">
              <HeroRackets viewLabel={t.courtMap.viewRacket} rackets={heroRackets} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
