'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { useMouseParallax } from '@/components/shared/useMouseParallax';
import { useLocalePath } from '@/lib/i18n/LocaleProvider';
import type { ContentMap } from '@/lib/content/get';

/**
 * Home hero — the same framed mock-up hero as the swipe pages (white rounded
 * frame, in-frame navbar, swipe chevrons, centered display headline, bottom
 * action row) over the night-courts still. Unlike the other pages this hero
 * is IN-FLOW, not fixed: home scrolls normally with no blanket-over-hero
 * effect (per client), which also means the browser culls it once scrolled
 * past — the cheapest hero of the five.
 */
export default function HomeHero({ content }: { content: ContentMap }) {
  const { x: parallaxX, y: parallaxY } = useMouseParallax(26);
  const lp = useLocalePath();

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
    <section data-cms="home:hero" className="ch-rail-exempt relative h-[100dvh] md:h-screen min-h-[620px] w-full p-2 sm:p-5 md:p-6 lg:p-8 bg-ink overflow-hidden text-center flex items-center justify-center">
      {/* Edge-to-edge night-courts background image */}
      <motion.div
        style={{ x: parallaxX, y: parallaxY }}
        className="absolute inset-[-4%] z-0 select-none pointer-events-none overflow-hidden scale-105 origin-center"
      >
        <img
          src={content['home.hero.bg_image']}
          alt=""
          aria-hidden
          className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.15] saturate-[1.15]"
          referrerPolicy="no-referrer"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-transparent to-ink/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,90,232,0.2)_0%,transparent_80%)]" />
      </motion.div>

      <div className="w-full h-full max-w-[1720px] mx-auto relative z-10 flex flex-col">
        {/* The outer polished rounded frame */}
        <div className="w-full h-full border-2 md:border-[3px] border-white/60 rounded-[28px] sm:rounded-[36px] md:rounded-[44px] overflow-hidden relative shadow-[0_32px_120px_rgba(0,0,0,0.7)] bg-black/15 flex flex-col justify-between p-3 pb-10 sm:p-8 md:p-10 lg:p-12">
          {/* In-frame navbar */}
          <HeroFrameNav active="home" />

          {/* Centered title with the breath-like float */}
          <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-8 z-10 select-none pointer-events-none">
            <div className="w-full flex flex-col items-center justify-center">
              <h1
                aria-label={phrases.map((p) => p.filter(Boolean).join(' ')).join(' · ')}
                className="w-full flex flex-col items-center font-display font-black text-center text-[42px] sm:text-[68px] md:text-[88px] lg:text-[108px] xl:text-[124px] leading-[0.85] tracking-tighter uppercase select-none"
              >
                <span aria-hidden key={`a${idx}`} className={`ch-rot-line block text-white drop-shadow-[0_8px_16px_rgba(6,26,68,0.6)] ${leaving ? 'is-leaving' : ''}`}>
                  {line1}
                </span>
                <span aria-hidden key={`b${idx}`} className={`ch-rot-line ch-rot-line--2 ch-rot-sky block mt-1 sm:mt-2 ${leaving ? 'is-leaving' : ''}`}>
                  {line2}
                </span>
              </h1>
              {/* Progress dashes: which promise is showing, and the timer to the next. */}
              {phrases.length > 1 && (
                <div aria-hidden className="mt-6 sm:mt-8 flex items-center gap-2">
                  {phrases.map((_, i) => (
                    <span key={i} className={`ch-rot-dash ${i === idx ? 'is-active' : ''}`}>
                      {i === idx && <span key={idx} className="ch-rot-dash-fill" />}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom row: copy + CTAs left, community badge right */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="relative z-30 w-full flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-t border-white/10 pt-4 mt-auto"
          >
            <div className="space-y-4 max-w-md text-start w-full lg:w-auto">
              <p className="text-white/80 text-xs sm:text-sm font-medium leading-relaxed drop-shadow-md">
                {content['home.hero.paragraph']}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                {/* Primary CTA (static) */}
                <Link
                  href={lp('/construct-your-court')}
                  className="px-6 py-3 bg-lime hover:bg-white text-ink font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-colors shadow-md"
                >
                  {content['home.hero.cta_primary']}
                </Link>

                <Link
                  href={lp('/shop')}
                  className="px-6 py-3 border border-white/30 backdrop-blur-sm bg-white/5 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full hover:bg-white/10 text-white transition-colors text-center"
                >
                  {content['home.hero.cta_secondary']}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
