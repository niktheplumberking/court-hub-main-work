'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import SwipeChevrons from '@/components/swipe/SwipeChevrons';
import { useMouseParallax } from '@/components/shared/useMouseParallax';

/**
 * Home hero — the same framed mock-up hero as the swipe pages (white rounded
 * frame, in-frame navbar, swipe chevrons, centered display headline, bottom
 * action row) over the night-courts still. Unlike the other pages this hero
 * is IN-FLOW, not fixed: home scrolls normally with no blanket-over-hero
 * effect (per client), which also means the browser culls it once scrolled
 * past — the cheapest hero of the five.
 */
export default function HomeHero() {
  const { x: parallaxX, y: parallaxY } = useMouseParallax(26);

  return (
    <section className="ch-rail-exempt relative h-[100dvh] md:h-screen min-h-[620px] w-full p-2 sm:p-5 md:p-6 lg:p-8 bg-ink overflow-hidden text-center flex items-center justify-center">
      {/* Edge-to-edge night-courts background image */}
      <motion.div
        style={{ x: parallaxX, y: parallaxY }}
        className="absolute inset-[-4%] z-0 select-none pointer-events-none overflow-hidden scale-105 origin-center"
      >
        <img
          src="/assets/images/hero_padel_night_view_1779713624496.png"
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
          {/* Prev/next page arrows — same swipe cycle as every hero */}
          <SwipeChevrons />

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
                  EXPERIENCE PADEL
                </motion.h1>
              </motion.div>

              <motion.div className="w-full flex justify-center mt-1 sm:mt-2">
                <motion.h1
                  initial={{ y: 35, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
                  className="font-display font-black text-white text-center text-[42px] sm:text-[68px] md:text-[88px] lg:text-[108px] xl:text-[124px] leading-[0.85] tracking-tighter uppercase select-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]"
                >
                  ELEVATED
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
                Premium padel courts engineered for the GCC, plus a curated shop
                of elite rackets and gear — all in one place.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                {/* Pulsating primary CTA */}
                <div className="relative inline-flex group">
                  <motion.span
                    animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0, 0.45] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-[#C8FF3D] rounded-full blur-md -z-10"
                  />
                  <motion.div
                    animate={{
                      rotate: [0, 1.2, -1.2, 0.8, -0.8, 0],
                      scale: [1, 1.025, 0.985, 1.025, 1],
                    }}
                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
                  >
                    <Link
                      href="/construct-your-court"
                      className="px-6 py-3 bg-[#C8FF3D] hover:bg-white text-ink font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-md block relative z-10"
                    >
                      Construct Your Court
                    </Link>
                  </motion.div>
                </div>

                <Link
                  href="/shop"
                  className="px-6 py-3 border border-white/30 backdrop-blur-sm bg-white/5 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full hover:bg-white/10 text-white transition-all text-center"
                >
                  Shop Now
                </Link>
              </div>
            </div>

            {/* Right bottom block — avatar row community badge */}
            <div className="max-w-sm space-y-3 text-left flex flex-col items-start lg:items-end w-full lg:w-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/25 rounded-full py-2 px-4 flex items-center shadow-2xl">
                <div className="flex -space-x-2.5">
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                  ].map((src, i) => (
                    <motion.img
                      key={i}
                      whileHover={{ scale: 1.25, zIndex: 10 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 15 }}
                      className="w-8 h-8 rounded-full border-2 border-[#0E0E0C] object-cover relative cursor-pointer"
                      src={src}
                      alt="Member"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                </div>
              </div>

              <p className="text-white/80 text-[11px] sm:text-xs leading-relaxed max-w-[280px] lg:text-right font-medium drop-shadow-md">
                We&apos;re committed to creating a premium play experience with a
                friendly, inclusive community for every member.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
