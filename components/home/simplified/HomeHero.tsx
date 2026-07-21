'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { useMouseParallax } from '@/components/shared/useMouseParallax';
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

  return (
    <section className="ch-rail-exempt relative h-[100dvh] md:h-screen min-h-[620px] w-full p-2 sm:p-5 md:p-6 lg:p-8 bg-ink overflow-hidden text-center flex items-center justify-center">
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
              <motion.div className="w-full flex justify-center">
                <motion.h1
                  initial={{ y: -35, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display font-black text-white text-center text-[42px] sm:text-[68px] md:text-[88px] lg:text-[108px] xl:text-[124px] leading-[0.85] tracking-tighter uppercase select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                >
                  {content['home.hero.title_line1']}
                </motion.h1>
              </motion.div>

              <motion.div className="w-full flex justify-center mt-1 sm:mt-2">
                <motion.h1
                  initial={{ y: 35, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
                  className="font-display font-black text-white text-center text-[42px] sm:text-[68px] md:text-[88px] lg:text-[108px] xl:text-[124px] leading-[0.85] tracking-tighter uppercase select-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]"
                >
                  {content['home.hero.title_line2']}
                </motion.h1>
              </motion.div>
            </div>
          </div>

          {/* Bottom row: copy + CTAs left, community badge right */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="relative z-30 w-full flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-t border-white/10 pt-4 mt-auto"
          >
            <div className="space-y-4 max-w-md text-left w-full lg:w-auto">
              <p className="text-white/80 text-xs sm:text-sm font-medium leading-relaxed drop-shadow-md">
                {content['home.hero.paragraph']}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                {/* Primary CTA (static) */}
                <Link
                  href="/construct-your-court"
                  className="px-6 py-3 bg-[#C8FF3D] hover:bg-white text-ink font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-colors shadow-md"
                >
                  {content['home.hero.cta_primary']}
                </Link>

                <Link
                  href="/shop"
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
