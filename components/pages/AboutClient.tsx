'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Footer from '@/components/home/Footer';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import { useMouseParallax } from '@/components/shared/useMouseParallax';
import { PRODUCTS } from '@/components/shop/placeholder-products';
import { useCart } from '@/lib/cart-context';
import HeroFrameNav from '@/components/swipe/HeroFrameNav';
import { useHeroCovered } from '@/components/swipe/useHeroCovered';
import type { ContentMap } from '@/lib/content/get';

const MotionLink = motion.create(Link);

/**
 * Stat strings like "180+", "18%", "2.1x" — leading number (commas/decimals
 * allowed) drives the AnimatedCounter; the remainder becomes its suffix. If
 * the string doesn't parse, render it statically as-is.
 */
function StatCounter({ raw }: { raw: string }) {
  const m = /^([\d,]+(?:\.\d+)?)(.*)$/.exec(raw);
  if (!m) return <>{raw}</>;
  // Thousands-style commas only — "2,1x" (decimal comma) renders statically
  // instead of silently becoming 21.
  const numeric = m[1].replace(/,(?=\d{3}(\D|$))/g, '');
  if (numeric.includes(',')) return <>{raw}</>;
  const value = parseFloat(numeric);
  if (Number.isNaN(value)) return <>{raw}</>;
  const decimals = numeric.includes('.') ? numeric.split('.')[1].length : 0;
  return <AnimatedCounter value={value} decimals={decimals} suffix={m[2]} />;
}

export default function AboutClient({ content }: { content: ContentMap }) {
  const TOPICS = useMemo(() => [
    {
      id: '01',
      title: content['about.topic1.title'],
      desc: content['about.topic1.desc'],
      seoText: content['about.topic1.seo_text'],
      image: content['about.topic1.image'],
      badge: content['about.topic1.badge']
    },
    {
      id: '02',
      title: content['about.topic2.title'],
      desc: content['about.topic2.desc'],
      seoText: content['about.topic2.seo_text'],
      image: content['about.topic2.image'],
      badge: content['about.topic2.badge']
    },
    {
      id: '03',
      title: content['about.topic3.title'],
      desc: content['about.topic3.desc'],
      seoText: content['about.topic3.seo_text'],
      image: content['about.topic3.image'],
      badge: content['about.topic3.badge']
    },
    {
      id: '04',
      title: content['about.topic4.title'],
      desc: content['about.topic4.desc'],
      seoText: content['about.topic4.seo_text'],
      image: content['about.topic4.image'],
      badge: content['about.topic4.badge']
    }
  ], [content]);
  const heroCovered = useHeroCovered();
  const { add, openDrawer } = useCart();
  const racketBestSellers = PRODUCTS.filter(p => p.category === 'rackets').slice(0, 5);
  const bestSellers = racketBestSellers.length >= 5 ? racketBestSellers : PRODUCTS.slice(0, 5);
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { x: parallaxX, y: parallaxY } = useMouseParallax(26);
  const { x: imgParallaxX, y: imgParallaxY } = useMouseParallax(12);
  const { x: ctaParallaxX, y: ctaParallaxY } = useMouseParallax(16);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalHeight = rect.height;
      const viewHeight = window.innerHeight;

      // Calculate how far we have scrolled past the start of the section
      const scrolledPastStart = -rect.top;
      const activeScrollRange = totalHeight - viewHeight;

      if (activeScrollRange > 0) {
        // progress maps from 0 (top of section) to 1 (end of scroll track)
        const progress = Math.max(0, Math.min(1, scrolledPastStart / activeScrollRange));
        setScrollProgress(progress);

        // We only show topics for progress 0.0 to 0.50.
        // Let's scale progress to [0, 1] for topics
        const topicsProgress = Math.min(1, progress / 0.50);
        const sectionIndex = Math.min(TOPICS.length - 1, Math.floor(topicsProgress * TOPICS.length));
        setActiveSection(sectionIndex);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Call once initially to set correct state
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (index: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const absoluteContainerTop = rect.top + window.scrollY;
    const totalHeight = rect.height;
    const viewHeight = window.innerHeight;
    const activeScrollRange = totalHeight - viewHeight;
    // Scale step fraction so clicking on scrollspy categories scrolls to the appropriate portion in [0.0, 0.50]
    const stepFraction = ((index + 0.5) / TOPICS.length) * 0.50;
    const targetScrollY = absoluteContainerTop + stepFraction * activeScrollRange;

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  };

  let percentX = 100;
  if (scrollProgress >= 0.50) {
    if (scrollProgress <= 0.65) {
      const progressInInterval = (scrollProgress - 0.50) / (0.65 - 0.50);
      percentX = 100 - (progressInInterval * 100);
    } else {
      percentX = 0;
    }
  }

  // Calculate reveal progress for step-by-step scroll-triggered fading once 100% in view
  // Finishing reveal at 0.88 instead of 1.00 grants luxurious scrolling headroom at the end
  const revealProgress = scrollProgress >= 0.65
    ? Math.min(1, (scrollProgress - 0.65) / (0.88 - 0.65))
    : 0;

  // Step 1: "FOUNDED AT" and "2024" highlight box (First category)
  // Widened track range (0.35 duration) and y-displacement of 40px for majestic, solid structural feeling
  const opacityStep1 = Math.min(1, Math.max(0, (revealProgress - 0.0) / 0.35));
  const yStep1 = 40 * (1 - opacityStep1);

  // Step 2: "1 ABOUT COURT HUB" badge + main headline text (Second category)
  // Carefully paced separation (starts at 0.35) and 0.35 duration for slow, luxurious reveal
  const opacityStep2 = Math.min(1, Math.max(0, (revealProgress - 0.35) / 0.35));
  const yStep2 = 40 * (1 - opacityStep2);

  // Step 3: Images & description / bottom grids (Third category)
  // Paced late in the cycle (starts at 0.70) with 0.30 duration, finishing elegantly at 1.0
  const opacityStep3 = Math.min(1, Math.max(0, (revealProgress - 0.70) / 0.30));
  const yStep3 = 40 * (1 - opacityStep3);

  return (
    <div className="ch-has-rail bg-ink min-h-screen text-white selection:bg-lime/30 font-sans antialiased">

      <main className="">

        {/* ================= SECTION 1: RECREATED "COURT HUB" MOCK-UP HERO ================= */}
        {/* Exactly viewport-height (no min-h): a fixed hero taller than the
            viewport can never be scrolled, so its frame bottom would be cut off
            on laptops. `invisible` once covered stops paint/composite cost. */}
        <div className={`fixed top-0 left-0 w-full h-[100dvh] md:h-screen z-0 pointer-events-auto${heroCovered ? ' invisible' : ''}`}>
          <section className="ch-rail-exempt relative h-full w-full p-2 sm:p-5 md:p-6 lg:p-8 bg-ink overflow-hidden text-center flex items-center justify-center">

          {/* Edge-to-Edge full screen background cinematic video / image fallback */}
          <motion.div
            style={{ x: parallaxX, y: parallaxY }}
            className="absolute inset-[-4%] z-0 select-none pointer-events-none overflow-hidden scale-105 origin-center"
          >
            <img
              src={content['about.hero.bg_image']}
              alt=""
              aria-hidden
              className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.15] saturate-[1.15]"
              referrerPolicy="no-referrer" fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-transparent to-ink/90" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,90,232,0.2)_0%,transparent_80%)]" />
          </motion.div>

          <div className="w-full h-full max-w-[1720px] mx-auto relative z-10 flex flex-col">
            {/* The Outer Frame simulating the premium mockup panel - thin polished rounded border exactly like reference */}
            <div
              className="w-full h-full border-2 md:border-[3px] border-white/60 rounded-[28px] sm:rounded-[36px] md:rounded-[44px] overflow-hidden relative shadow-[0_32px_120px_rgba(0,0,0,0.7)] bg-black/15 flex flex-col justify-between p-3 pb-10 sm:p-8 md:p-10 lg:p-12"
            >


              {/* 2. In-frame hero navbar (the design's integrated sub-header row) */}
              <HeroFrameNav active="about" />

              {/* 3. Centered Title Blocks: "EXPERIENCE PADEL", "ELEVATED" with organic, breath-like floating motions */}
              <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-8 z-10 select-none pointer-events-none">
                <div className="w-full flex flex-col items-center justify-center">
                {/* Text Row 1 */}
                <motion.div className="w-full flex justify-center">
                  <motion.h1
                    initial={{ y: -35, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="font-display font-black text-white text-center text-[42px] sm:text-[68px] md:text-[88px] lg:text-[108px] xl:text-[124px] leading-[0.85] tracking-tighter uppercase select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                  >
                    {content['about.hero.title_line1']}
                  </motion.h1>
                </motion.div>

                {/* Text Row 2 */}
                <motion.div className="w-full flex justify-center mt-1 sm:mt-2">
                  <motion.h1
                    initial={{ y: 35, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
                    className="font-display font-black text-white text-center text-[42px] sm:text-[68px] md:text-[88px] lg:text-[108px] xl:text-[124px] leading-[0.85] tracking-tighter uppercase select-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]"
                  >
                    {content['about.hero.title_line2']}
                  </motion.h1>
                </motion.div>
                </div>
              </div>

              {/* 4. Glass Framed Bottom Row: Actions + Communities rating badge */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="relative z-30 w-full flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-t border-white/10 pt-4 mt-auto"
              >

                {/* Left Bottom Block - Piles */}
                <div className="space-y-4 max-w-md text-left w-full lg:w-auto">
                  <p className="text-white/80 text-xs sm:text-sm font-medium leading-relaxed drop-shadow-md">
                    {content['about.hero.paragraph']}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Primary CTA (static) */}
                    <Link
                      href="/contact"
                      className="px-6 py-3 bg-[#C8FF3D] hover:bg-white text-ink font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-colors shadow-md"
                    >
                      {content['about.hero.cta_primary']}
                    </Link>

                    <Link
                      href="/construct-your-court"
                      className="px-6 py-3 border border-white/30 backdrop-blur-sm bg-white/5 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full hover:bg-white/10 text-white transition-colors text-center"
                    >
                      {content['about.hero.cta_secondary']}
                    </Link>
                  </div>
                </div>

              </motion.div>

            </div>
          </div>
        </section>
        </div>

        {/* Spacer to allow scrolling past the fixed background hero */}
        <div className="relative w-full h-screen pointer-events-none z-0" />

        {/* ================= BLANKET OVERLAY CONTENT ================= */}
        <div className="relative z-10 bg-ink shadow-[0_-24px_50px_rgba(0,0,0,0.6)]">

        {/* ================= SECTION 2: COMPANY STORY (Premium Sand/#EDE8E1 Theme / Editorial Feel) ================= */}
        <section className="min-h-screen flex flex-col justify-center py-20 sm:py-28 md:py-36 px-6 md:px-12 lg:px-16 xl:px-20 bg-sand text-ink relative overflow-hidden">
          {/* Playful abstract geometric court lines background */}
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none text-ink">
            <svg width="100%" height="100%">
              <line x1="10%" y1="0" x2="10%" y2="100%" stroke="currentColor" strokeWidth="2" />
              <line x1="90%" y1="0" x2="90%" y2="100%" stroke="currentColor" strokeWidth="2" strokeDasharray="10 10" />
              <circle cx="50%" cy="50%" r="200" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(30,90,232,0.03)_0%,transparent_60%)] pointer-events-none" />

          {/* Main content container with absolute hierarchy: Title -> Photo -> Text & Stats */}
          <div className="max-w-7xl mx-auto w-full space-y-12 md:space-y-16 relative z-10">

            {/* 1. TITLE BLOCK: First visual anchor */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-left space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0E0E0C] text-[#C8FF3D] font-mono text-xs flex items-center justify-center font-black">
                  1
                </div>
                <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold border border-ink/10 px-4 py-1.5 rounded-full bg-[#0E0E0C]/5 text-[#0E0E0C] shadow-sm">
                  {content['about.story.eyebrow']}
                </div>
              </div>
              <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black uppercase italic leading-[0.85] tracking-tighter text-[#0E0E0C]">
                {content['about.story.headline_part1']} <span className="text-court-blue">{content['about.story.headline_part2']}</span> <br className="hidden sm:inline" />
                <span className="relative inline-block text-ink">
                  {content['about.story.headline_part3']}
                  {/* Lime drawn underline — pure-CSS loop (.ch-underline-draw in globals.css);
                      runs regardless of OS reduce-motion, unlike the old Framer keyframe loop. */}
                  <span
                    aria-hidden
                    className="ch-underline-draw absolute left-0 bottom-1 sm:bottom-2 h-2 sm:h-3 bg-[#C8FF3D] w-full -z-10 rounded-full opacity-80"
                  />
                </span>.
              </h2>
            </motion.div>

            {/* Structured Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

              {/* 2. PHOTO COLUMN: Styled as primary visual highlight (Second visual anchor) */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-7 space-y-6"
              >
                <div className="relative aspect-[16/10] rounded-[32px] overflow-hidden border border-ink/10 shadow-2xl group cursor-pointer">
                  <img
                    src={content['about.story.image']}
                    alt="Aesthetic Padel Court Action Closeup"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-104 group-hover:rotate-0.5"
                    referrerPolicy="no-referrer" loading="lazy" decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0C]/95 via-transparent to-transparent p-6 sm:p-8 flex flex-col justify-end" />
                  <div className="absolute bottom-6 left-6 text-white text-left mr-6 space-y-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider bg-[#C8FF3D] text-ink px-2.5 py-1 rounded font-black inline-block">{content['about.story.image_badge']}</span>
                    <p className="font-display text-sm sm:text-base md:text-lg font-bold italic uppercase text-white leading-tight">{content['about.story.image_caption']}</p>
                  </div>
                </div>
              </motion.div>

              {/* 3. NARRATIVES & STATS: Fully playful third visual anchor */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-5 space-y-8 text-left"
              >
                <p className="text-ink/85 text-sm sm:text-base md:text-lg leading-relaxed font-sans font-medium">
                  {content['about.story.paragraph1']}
                </p>
                <p className="text-ink/70 text-xs sm:text-sm leading-relaxed font-sans font-medium">
                  {content['about.story.paragraph2']}
                </p>                 {/* Playful counting statistics row with zoom and brand color-exchanging hover animations */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-ink/10 text-left">
                  <div className="group/stat cursor-pointer">
                    <motion.p
                      whileHover={{ scale: 1.15, color: '#C8FF3D', textShadow: '0 4px 12px rgba(10,13,24,0.12)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-court-blue tracking-tighter origin-left inline-block"
                    >
                      <StatCounter raw={content['about.story.stat1_value']} />
                    </motion.p>
                    <p className="text-[9px] sm:text-[10px] font-mono text-ink/50 uppercase tracking-widest mt-1.5 leading-snug font-bold transition-colors group-hover/stat:text-ink/85">{content['about.story.stat1_caption']}</p>
                  </div>
                  <div className="group/stat cursor-pointer">
                    <motion.p
                      whileHover={{ scale: 1.15, color: '#C8FF3D', textShadow: '0 4px 12px rgba(10,13,24,0.12)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-ink tracking-tighter origin-left inline-block"
                    >
                      <StatCounter raw={content['about.story.stat2_value']} />
                    </motion.p>
                    <p className="text-[9px] sm:text-[10px] font-mono text-ink/50 uppercase tracking-widest mt-1.5 leading-snug font-bold transition-colors group-hover/stat:text-ink/85">{content['about.story.stat2_caption']}</p>
                  </div>
                  <div className="group/stat cursor-pointer">
                    <motion.p
                      whileHover={{ scale: 1.15, color: '#C8FF3D', textShadow: '0 4px 12px rgba(10,13,24,0.12)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-court-blue tracking-tighter origin-left inline-block"
                    >
                      <StatCounter raw={content['about.story.stat3_value']} />
                    </motion.p>
                    <p className="text-[9px] sm:text-[10px] font-mono text-ink/50 uppercase tracking-widest mt-1.5 leading-snug font-bold transition-colors group-hover/stat:text-ink/85">{content['about.story.stat3_caption']}</p>
                  </div>
                </div>
              </motion.div>

            </div>

          </div>
        </section>
        {/* ================= SECTION 3: STRATEGIC BLUEPRINT (High-Fidelity Scrollspy Section) ================= */}
        <section ref={containerRef} className="relative h-[750vh] bg-court-blue border-t border-b border-white/15">
          <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(212,255,63,0.08)_0%,transparent_70%)] pointer-events-none" />

            {/* pt-16 on mobile reserves space for the fixed header so the vertically
                centered content never tucks underneath it on a short (bars-open) viewport. */}
            <div className="max-w-7xl mx-auto w-full px-6 md:px-8 pt-16 lg:pt-0">

              {/* Split layout: left sticky card (Pics), right list content (text) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative">

                {/* Left Column: Sticky Image Card - Highly Interactive Tactile Stacked Deck Sequence (SWAPPED to Left) */}
                <div className="hidden lg:block lg:col-span-6 h-[580px] w-full relative">
                  <div className="relative w-full h-full flex items-center justify-center">

                    {TOPICS.map((topic, i) => {
                      // Determine stacked state relative to active index
                      const isPast = i < activeSection;
                      const isActive = i === activeSection;
                      const isFuture = i > activeSection;

                      // Base card layout parameters
                      let rotate = 0;
                      let yOffset = 0;
                      let scale = 1;
                      let opacity = 1;

                      if (isActive) {
                        rotate = 0;
                        yOffset = 0;
                        scale = 1;
                        opacity = 1;
                      } else if (isPast) {
                        // Past cards go under and rotate to show a stacked aesthetic
                        // We alternate the rotation directions (even index rotates counter-clockwise, odd rotates clockwise)
                        rotate = i % 2 === 0 ? -6 : 6;
                        yOffset = -8; // slight stack lift
                        scale = 0.95; // slightly nested behind
                        opacity = 0.75; // peek support
                      } else if (isFuture) {
                        // Future cards slide in from the bottom
                        rotate = 10;
                        yOffset = 620;
                        scale = 1.05;
                        opacity = 0;
                      }

                      // Seamless dynamic blend as scroll progress changes through segment intervals
                      const topicsCount = TOPICS.length;
                      const segmentProgress = (scrollProgress / 0.50) * topicsCount - activeSection;
                      const clampedSegmentOffset = Math.max(0, Math.min(1, segmentProgress));

                      // 1. If this is the next upcoming card, slide up over the current deck as user scrolls
                      if (activeSection + 1 === i) {
                        yOffset = 620 - (clampedSegmentOffset * 620);
                        rotate = 10 - (clampedSegmentOffset * 10);
                        opacity = clampedSegmentOffset;
                        scale = 1.05 - (clampedSegmentOffset * 0.05);
                      }

                      // 2. If this is the currently active card, rotate away underneath as the next card climbs
                      if (isActive && activeSection < topicsCount - 1) {
                        const targetRotation = i % 2 === 0 ? -6 : 6;
                        rotate = clampedSegmentOffset * targetRotation;
                        scale = 1 - (clampedSegmentOffset * 0.05);
                        opacity = 1 - (clampedSegmentOffset * 0.25);
                        yOffset = clampedSegmentOffset * -8;
                      }

                      return (
                        <motion.div
                          key={topic.id}
                          style={{
                            zIndex: 10 + i,
                          }}
                          animate={{
                            y: yOffset,
                            rotate: rotate,
                            scale: scale,
                            opacity: opacity,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 120,
                            damping: 24,
                            mass: 0.9
                          }}
                          className="absolute inset-0 w-full h-full rounded-[32px] overflow-hidden border border-white/15 bg-black/40 shadow-[0_24px_60px_rgba(0,0,0,0.35)] origin-bottom"
                        >
                          <img
                            src={topic.image}
                            alt={topic.title}
                            className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.1] saturate-[1.1]"
                            referrerPolicy="no-referrer" loading="lazy" decoding="async"
                          />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[black]/95 via-[black]/20 to-transparent p-8 flex flex-col justify-end text-left" />

                          {/* Floating Indicator */}
                          <div className="absolute top-6 right-6 font-mono text-[9px] uppercase tracking-wider bg-[#C8FF3D] text-[#0E0E0C] px-3.5 py-1.5 rounded-full font-bold shadow-lg">
                            {topic.badge}
                          </div>

                          {/* Summary details on image */}
                          <div className="absolute bottom-6 left-6 right-6 text-white space-y-1 z-10 text-left">
                            <span className="font-mono text-[10px] uppercase text-[#C8FF3D] tracking-widest font-semibold block">{content['about.blueprint.card_kicker']}</span>
                            <h4 className="font-display text-lg font-bold italic uppercase tracking-tight text-white leading-tight">
                              {topic.title}
                            </h4>
                          </div>
                        </motion.div>
                      );
                    })}

                  </div>
                </div>

                {/* Right Column: Topics / Scroll anchors (SWAPPED to Right) */}
                <div className="lg:col-span-6 space-y-3 lg:space-y-8 text-left">

                  {/* Simulated Badge matching the reference screenshot exactly with color contrast calibration */}
                  <div id="dna-strategy-trigger" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0E0E0C] text-[#C8FF3D] font-mono text-xs flex items-center justify-center font-black">
                      2
                    </div>
                    <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold border border-white/10 px-4 py-1.5 rounded-full bg-white/10 text-white shadow-sm">
                      {content['about.blueprint.eyebrow']}
                    </div>
                  </div>

                  {/* Subtitle / Main heading matching screenshot layout with vivid lime highlighted focus */}
                  <h2 className="text-xl md:text-5xl font-display font-black uppercase italic tracking-tight text-white leading-[1.05] md:leading-[0.95] mt-1 lg:mt-4">
                    {content['about.blueprint.headline_line1']} <br />
                    <span className="text-[#C8FF3D]">{content['about.blueprint.headline_highlight']}</span>
                  </h2>

                  {/* Categories container */}
                  <div className="mt-2 lg:mt-8 space-y-0 text-left">
                    {TOPICS.map((topic, index) => {
                      const isActive = activeSection === index;
                      return (
                        <div
                          key={topic.id}
                          id={`dna-topic-${index}`}
                          onClick={() => scrollToSection(index)}
                          className="group pt-2 pb-2 lg:pt-6 lg:pb-6 flex flex-col cursor-pointer select-none border-t border-white/15 transition-colors"
                        >
                          <div className="flex gap-3 lg:gap-6 items-start">
                            {/* Number index */}
                            <span className={`font-mono text-xs font-bold transition-all duration-300 ${isActive ? 'text-[#C8FF3D]' : 'text-white/40'}`}>
                              {topic.id}
                            </span>

                            {/* Text elements. Inactive titles shrink on mobile (smaller font) to
                                free vertical space for the active topic's full, un-clamped copy. */}
                            <div className="space-y-2 flex-1 text-left">
                              <h3 className={`font-display font-black uppercase italic tracking-tight transition-all duration-300 md:text-xl ${isActive ? 'text-base md:text-xl text-white scale-102 origin-left' : 'text-[13px] text-white/40 scale-100 group-hover:text-white/70'}`}>
                                {topic.title}
                              </h3>

                              {/* Expandable description with Framer Motion. Smooth and performant */}
                              <motion.div
                                initial={false}
                                animate={{
                                  height: isActive ? 'auto' : 0,
                                  opacity: isActive ? 1 : 0
                                }}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                              >
                                <p className="text-xs md:text-sm text-white/85 leading-relaxed font-sans font-medium mt-1">
                                  {topic.desc}
                                </p>

                                {/* SEO text — full copy on every breakpoint (no clamp); the
                                    shrunk inactive titles above buy back the space it needs. */}
                                <p className="text-[10px] md:text-xs text-white/70 leading-snug md:leading-relaxed font-mono mt-1.5 mb-1 border-l-2 border-[#C8FF3D] pl-2.5 md:pl-3 italic bg-black/15 p-2 md:p-2.5 rounded-r-xl">
                                  {topic.seoText}
                                </p>

                                {/* Mobile inline graphic fallback */}
                                <div className="lg:hidden mt-2 h-[92px] sm:h-[120px] rounded-[20px] overflow-hidden border border-white/10 relative shadow-md">
                                  <img
                                    src={topic.image}
                                    alt={topic.title}
                                    className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.1] saturate-[1.1]"
                                    referrerPolicy="no-referrer" loading="lazy" decoding="async"
                                  />
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                    <span className="font-mono text-[9px] uppercase tracking-wider bg-[#C8FF3D] text-[#0E0E0C] px-2 py-0.5 rounded font-bold">
                                      {topic.badge}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

              </div>
            </div>

          {/* The sliding Brand Positioning panel */}
          <motion.div
            style={{ x: `${percentX}%` }}
            className="absolute inset-0 bg-[#EDE8E1] text-[#0E0E0C] z-30 flex items-start sm:items-center overflow-y-auto lg:overflow-y-auto px-6 md:px-8 pt-[76px] pb-3 sm:py-8 lg:py-10 border-l border-white/5 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Grid Background with fine spacing for balanced quadrants and elegant reduced opacity (0.04) */}
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,rgba(10,13,24,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(10,13,24,0.04)_1px,transparent_1px)] bg-[size:5.0rem_5.0rem] pointer-events-none" />

            <div className="max-w-[85rem] xl:max-w-[90rem] 2xl:max-w-[96rem] mx-auto w-full px-6 md:px-12 lg:px-16 xl:px-20 relative z-10 lg:my-auto py-3 sm:py-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12 xl:gap-16 items-start text-left">

                {/* Left Column: Foundation Year Anchor - STEP 1 */}
                <motion.div
                  animate={{ opacity: opacityStep1, y: yStep1 }}
                  transition={{ type: "spring", stiffness: 45, damping: 22, mass: 1.2 }}
                  className="lg:col-span-3 lg:sticky lg:top-24 space-y-3"
                >
                  <span className="font-mono text-xs uppercase tracking-widest text-[#0E0E0C]/60 font-semibold block">
                    {content['about.positioning.founded_label']}
                  </span>

                  {/* Highlight box matching reference screenshot layout exactly */}
                  <div className="w-full max-w-[220px] aspect-[2.1/1] bg-[#C8FF3D] text-[#0E0E0C] flex items-center justify-center rounded-[24px] shadow-[0_12px_36px_rgba(212,255,62,0.18)] select-none border border-[#C8FF3D] hover:scale-[1.12] hover:-rotate-3 hover:shadow-[0_20px_48px_rgba(212,255,62,0.35)] transition-all duration-300 ease-out">
                    <span className="font-sans text-5xl md:text-6xl font-black italic tracking-tighter leading-none select-none">
                      {content['about.positioning.founded_year']}
                    </span>
                  </div>
                </motion.div>

                {/* Right Column: Hero copy and multi-aspect imagery */}
                <div className="lg:col-span-9 space-y-4 lg:space-y-8">

                  {/* Indicator Badge + Header - STEP 2 with high-end typography hierarchy */}
                  <motion.div
                    animate={{ opacity: opacityStep2, y: yStep2 }}
                    transition={{ type: "spring", stiffness: 45, damping: 22, mass: 1.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0E0E0C] text-[#C8FF3D] font-mono text-xs flex items-center justify-center font-black">
                        3
                      </div>
                      <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold border border-ink/10 px-4 py-1.5 rounded-full bg-white text-ink shadow-sm">
                        {content['about.positioning.eyebrow']}
                      </div>
                    </div>

                    <h2 className="text-2xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-display font-black uppercase italic leading-[0.85] tracking-tighter text-[#0E0E0C]">
                      {content['about.positioning.headline_part1']} <span className="text-court-blue">{content['about.positioning.headline_part2']}</span> <br className="hidden sm:inline" />
                      <span className="relative inline-block text-ink">
                        {content['about.positioning.headline_part3']}
                        {/* Lime drawn underline — pure-CSS loop (.ch-underline-draw in globals.css);
                            runs regardless of OS reduce-motion, unlike the old Framer keyframe loop. */}
                        <span
                          aria-hidden
                          className="ch-underline-draw absolute left-0 bottom-1 sm:bottom-2 h-2 sm:h-3 bg-[#C8FF3D] w-full -z-10 rounded-full opacity-80"
                        />
                      </span>.
                    </h2>

                    <p className="text-xs sm:text-sm md:text-base lg:text-base font-sans font-medium text-[#0E0E0C]/80 leading-relaxed max-w-4xl pt-1">
                      {content['about.positioning.paragraph1']}
                    </p>
                  </motion.div>

                  {/* Grid for Left Vertical Portrait and Right Landscape + Detail Section - STEP 3 */}
                  <motion.div
                    animate={{ opacity: opacityStep3, y: yStep3 }}
                    transition={{ type: "spring", stiffness: 45, damping: 22, mass: 1.2 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 lg:gap-8 items-center pt-1"
                  >

                    {/* Left portrait image column with safe capped height constraint and mouse parallax */}
                    <div className="md:col-span-6 relative h-[230px] sm:h-[240px] md:h-[280px] lg:h-[320px] xl:h-[350px] w-full rounded-[32px] overflow-hidden border border-ink/10 shadow-xl group cursor-pointer bg-black animate-none">
                      <motion.div
                        style={{ x: imgParallaxX, y: imgParallaxY }}
                        className="absolute inset-[-6%] w-[112%] h-[112%] origin-center"
                      >
                        <img
                          src={content['about.positioning.portrait_image']}
                          alt="Player Execution Stroke Portrait"
                          className="w-full h-full object-cover object-[center_35%] sm:object-center transition-all duration-700 ease-out group-hover:scale-112 group-hover:rotate-2 group-hover:brightness-[1.02] filter contrast-[1.05] brightness-[0.95]"
                          referrerPolicy="no-referrer" loading="lazy" decoding="async"
                        />
                      </motion.div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0C]/85 via-transparent to-transparent p-6 flex flex-col justify-end pointer-events-none" />
                      <div className="absolute bottom-6 left-6 text-white text-left space-y-1.5 z-10 font-sans pointer-events-none">
                        <span className="font-mono text-[9px] uppercase tracking-[0.15em] bg-court-blue text-white px-2.5 py-1 rounded font-bold inline-block">{content['about.positioning.portrait_badge']}</span>
                        <p className="font-display text-xs sm:text-sm font-bold italic uppercase tracking-wider text-white">{content['about.positioning.portrait_caption']}</p>
                      </div>
                    </div>

                    {/* Right landscape image + descriptor column */}
                    <div className="md:col-span-6 space-y-4 lg:space-y-6 flex flex-col justify-between text-left">

                      {/* Landscape image column with mouse parallax and increased height for improved crop/fit */}
                      <div className="relative h-[110px] sm:h-[130px] md:h-[150px] lg:h-[170px] xl:h-[180px] w-full rounded-[32px] overflow-hidden border border-ink/10 shadow-xl group hidden md:block cursor-pointer bg-black">
                        <motion.div
                          style={{ x: imgParallaxX, y: imgParallaxY }}
                          className="absolute inset-[-6%] w-[112%] h-[112%] origin-center"
                        >
                          <img
                            src={content['about.positioning.landscape_image']}
                            alt="Play action on synthetic blue turf court"
                            className="w-full h-full object-cover object-[center_30%] transition-all duration-700 ease-out group-hover:scale-112 group-hover:-rotate-2 group-hover:brightness-[1.02] filter contrast-[1.05] brightness-[0.95]"
                            referrerPolicy="no-referrer" loading="lazy" decoding="async"
                          />
                        </motion.div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0C]/85 via-transparent to-transparent p-4 flex flex-col justify-end pointer-events-none" />
                        <div className="absolute bottom-4 left-4 text-white text-left space-y-1 z-10 font-sans pointer-events-none">
                          <span className="font-mono text-[9px] uppercase tracking-[0.15em] bg-[#C8FF3D] text-ink px-2.5 py-1 rounded font-black font-semibold inline-block">{content['about.positioning.landscape_badge']}</span>
                          <p className="font-display text-xs sm:text-sm font-bold italic uppercase tracking-wider text-white">{content['about.positioning.landscape_caption']}</p>
                        </div>
                      </div>

                      <div className="space-y-4 flex-1 flex flex-col items-start bg-white/40 p-3 sm:p-5 rounded-3xl border border-ink/5 shadow-sm hover:bg-white/50 transition-colors duration-300">
                        <p className="text-xs sm:text-sm lg:text-sm text-ink/85 leading-relaxed font-sans font-medium">
                          {content['about.positioning.paragraph2']}
                        </p>

                        <Link
                          href="/contact"
                          className="inline-flex items-center gap-2 group text-xs font-mono font-bold uppercase tracking-widest text-[#0E0E0C] hover:text-court-blue border border-ink/15 px-5 py-2.5 rounded-full bg-white hover:bg-white/80 transition-all shadow-md group shrink-0"
                        >
                          <span>{content['about.positioning.cta_label']}</span>
                          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[#0E0E0C]" />
                        </Link>
                      </div>

                    </div>

                  </motion.div>

                </div>

              </div>
            </div>
          </motion.div>
        </div>
      </section>
        {/* ================= SECTION 5: CALL TO ACTION (CTA - Dark Card Wheel Concept) ================= */}
        <section className="pt-16 sm:pt-20 px-6 md:px-8 text-center relative overflow-hidden bg-ink pb-0">
          {/* Symmetrical ambient radial light gradient matching the image */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,255,61,0.06)_0%,transparent_60%)] pointer-events-none" />

          <motion.div
            style={{ x: ctaParallaxX, y: ctaParallaxY }}
            className="max-w-4xl mx-auto space-y-4 sm:space-y-6 relative z-10"
          >
            <span className="font-mono text-[10px] md:text-sm uppercase bg-lime/10 px-4 py-1.5 border border-lime/20 rounded-full text-lime inline-block tracking-widest font-bold">
              {content['about.cta.eyebrow']}
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-black uppercase italic tracking-tight text-white leading-none mt-4">
              {content['about.cta.headline_line1']} <br />
              <span className="text-lime">{content['about.cta.headline_highlight']}</span>
            </h2>
            <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
              {content['about.cta.paragraph']}
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <MotionLink
                href="/construct-your-court"
                animate={{
                  boxShadow: [
                    "0 4px 14px 0px rgba(200,255,61,0.25)",
                    "0 6px 30px 6px rgba(200,255,61,0.65)",
                    "0 4px 14px 0px rgba(200,255,61,0.25)"
                  ],
                  scale: [1, 1.03, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{ scale: 1.08 }}
                className="px-8 py-4 bg-lime text-ink rounded-full font-mono font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 shadow-lg shadow-lime/15"
              >
                <span>{content['about.cta.cta_primary']}</span>
                <ArrowUpRight className="w-4 h-4 text-ink" />
              </MotionLink>
              <Link
                href="/contact"
                className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-mono text-xs uppercase font-bold tracking-widest hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105"
              >
                {content['about.cta.cta_secondary']}
              </Link>
            </div>
          </motion.div>

          {/* Symmetrical overlapping wide-screen card flow perfectly mimicking the shared screenshot */}
          <div className="relative w-full max-w-6xl mx-auto mt-12 sm:mt-16 overflow-visible flex flex-col items-center justify-center scale-[0.85] sm:scale-[0.95] md:scale-100 origin-center pb-12">

            {/* Ambient lime shadow glow beneath the cards */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-4/5 h-[80px] sm:h-[130px] bg-lime/10 blur-3xl rounded-full pointer-events-none z-0" />            {/* Real best-seller product cards */}
            {/* Fanned "rainbow" deck — original arc arrangement, each card now a real
                best-seller: placeholder image + Add-to-Bag + View-product. Hover lifts
                and straightens a card to reveal it (matches the original interaction). */}
            <div className="flex flex-nowrap justify-center items-center -space-x-10 sm:-space-x-16 md:-space-x-24 w-full overflow-visible py-10 relative z-10 select-none">
              {bestSellers.map((p, index) => {
                const cfg = [
                  { rotate: -12, y: 38, zIndex: 10, opacity: 0.7 },
                  { rotate: -6, y: 14, zIndex: 20, opacity: 0.9 },
                  { rotate: 0, y: 0, zIndex: 30, opacity: 1 },
                  { rotate: 6, y: 14, zIndex: 25, opacity: 0.9 },
                  { rotate: 12, y: 38, zIndex: 10, opacity: 0.7 },
                ][index] || { rotate: 0, y: 0, zIndex: 20, opacity: 1 };
                return (
                  <motion.div
                    key={p.id}
                    style={{ rotate: cfg.rotate, y: cfg.y, zIndex: cfg.zIndex, opacity: cfg.opacity }}
                    whileHover={{ scale: 1.12, rotate: 0, y: -18, zIndex: 100, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    className="group relative flex-shrink-0 w-[190px] sm:w-[230px] md:w-[260px] rounded-[24px] bg-white border border-ink/10 p-3 shadow-[0_18px_45px_-12px_rgba(14,14,12,0.3)] flex flex-col gap-2.5 cursor-pointer"
                  >
                    <span className="absolute top-4 left-4 z-20 text-[9px] bg-lime text-ink px-2 py-0.5 rounded font-bold uppercase tracking-wider shadow-sm">
                      {content['about.bestsellers.badge']}
                    </span>
                    <div className="rounded-[16px] bg-[#F5F4F0] aspect-[4/3] flex items-center justify-center p-3 overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer" loading="lazy" decoding="async"
                      />
                    </div>
                    <div className="px-1">
                      <p className="text-[10px] font-mono text-ink/40 uppercase tracking-wide">{p.brand}</p>
                      <h4 className="font-display font-black uppercase text-ink text-sm leading-tight line-clamp-1">{p.name}</h4>
                      <span className="font-display font-black text-[#1E5AE8] text-base">AED {p.price}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-auto">
                      <button
                        onClick={() => {
                          add({ id: p.id, slug: p.id, title: p.name, price_aed: p.price, image: p.image, max_qty: 99 }, 1);
                          openDrawer();
                        }}
                        className="w-full py-2 rounded-full bg-lime text-ink text-[10px] font-bold uppercase tracking-wider hover:bg-ink hover:text-white transition-colors"
                      >
                        {content['about.bestsellers.add_to_bag_label']}
                      </button>
                      <Link
                        href={`/shop/${p.id}`}
                        className="w-full py-2 rounded-full border border-ink/15 text-ink/70 text-[10px] font-bold uppercase tracking-wider text-center hover:bg-ink/5 transition-colors"
                      >
                        {content['about.bestsellers.view_product_label']}
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Seamless Bottom Gradient Fade into Footers */}
            <div className="absolute bottom-0 left-0 w-full h-[60px] sm:h-[80px] bg-gradient-to-t from-ink via-ink/85 to-transparent pointer-events-none z-25" />
          </div>
        </section>

        {/* Standard Joint Footer */}
        <Footer hideTopBorder />

        </div>
      </main>

    </div>
  );
}
