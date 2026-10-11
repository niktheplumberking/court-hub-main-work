'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ShoppingBag } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ─── PLACEHOLDER COPY — replace with client-provided copy (contract §8) ───
const ABOUT_BLURB =
  'Pro-level rackets and gear, championship-grade court construction, and a community that lives for padel — Court Hub powers the game across the UAE.';
// ─── END PLACEHOLDER COPY ───

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const parallaxImgRef = useRef<HTMLImageElement>(null);
  const aboutCtaRef = useRef<HTMLAnchorElement>(null);
  const aboutCtaLabelRef = useRef<HTMLSpanElement>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8 } },
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Masked reveal on the action shot (bible #4): clip-path wipe + settle scale.
        const reveal = gsap.timeline({
          scrollTrigger: {
            trigger: maskRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
        reveal
          .fromTo(
            maskRef.current,
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out' },
            0,
          )
          .from(parallaxImgRef.current, { scale: 1.3, duration: 1.4, ease: 'expo.out' }, 0);

        // Headline line-rise (bible #5)
        gsap.from('[data-about-line]', {
          yPercent: 110,
          duration: 1.0,
          ease: 'power4.out',
          stagger: 0.09,
          scrollTrigger: {
            trigger: headlineRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });

        // Eyebrow row + supporting paragraph rise
        gsap.from('[data-about-rise]', {
          y: 24,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.09,
          scrollTrigger: {
            trigger: headlineRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      // Image parallax inside the mask — 1:1 scrub, desktop only (bible #4).
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          parallaxImgRef.current,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: maskRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      });

      // Magnetic About Us CTA (bible #2): pull = delta*0.35, label counter *0.15,
      // elastic release. Center cached on enter minus current transform → no feedback jitter.
      mm.add(
        '(min-width: 768px) and (prefers-reduced-motion: no-preference) and (pointer: fine)',
        () => {
          const pill = aboutCtaRef.current;
          const label = aboutCtaLabelRef.current;
          if (!pill) return;

          const xTo = gsap.quickTo(pill, 'x', { duration: 0.4, ease: 'power3' });
          const yTo = gsap.quickTo(pill, 'y', { duration: 0.4, ease: 'power3' });
          const labelXTo = label ? gsap.quickTo(label, 'x', { duration: 0.4, ease: 'power3' }) : null;
          const labelYTo = label ? gsap.quickTo(label, 'y', { duration: 0.4, ease: 'power3' }) : null;

          let baseX = 0;
          let baseY = 0;
          const onEnter = () => {
            const r = pill.getBoundingClientRect();
            baseX = r.left + r.width / 2 - (Number(gsap.getProperty(pill, 'x')) || 0);
            baseY = r.top + r.height / 2 - (Number(gsap.getProperty(pill, 'y')) || 0);
          };
          const onMove = (e: PointerEvent) => {
            const dx = e.clientX - baseX;
            const dy = e.clientY - baseY;
            xTo(dx * 0.35);
            yTo(dy * 0.35);
            labelXTo?.(dx * 0.15);
            labelYTo?.(dy * 0.15);
          };
          const onLeave = () => {
            gsap.to(pill, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,0.3)', overwrite: 'auto' });
            if (label) {
              gsap.to(label, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,0.3)', overwrite: 'auto' });
            }
          };

          pill.addEventListener('pointerenter', onEnter);
          pill.addEventListener('pointermove', onMove);
          pill.addEventListener('pointerleave', onLeave);
          return () => {
            pill.removeEventListener('pointerenter', onEnter);
            pill.removeEventListener('pointermove', onMove);
            pill.removeEventListener('pointerleave', onLeave);
          };
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="about" className="bg-court-blue min-h-screen py-16 md:py-24 px-6 md:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 items-start">

        {/* Left Column: Description & Portrait */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="md:col-span-3 space-y-8 md:space-y-12"
        >
          {/* Subtitle with ball */}
          <motion.div variants={itemVariants} className="space-y-6 md:space-y-8">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shadow-2xl rotate-3">
              <img
                src="/images/padel_ball_icon_1779705611997.webp"
                alt="Padel Ball"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer" loading="lazy" decoding="async"
              />
            </div>
            <p className="text-white/90 text-base md:text-lg font-medium leading-snug max-w-[280px]">
              {ABOUT_BLURB}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {/* Magnetic About Us CTA (was a dead "Book a Court" button) */}
              <Link
                ref={aboutCtaRef}
                href="/about"
                className="group flex items-center bg-white rounded-full p-1 pr-6 gap-3 w-fit transition-shadow duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] will-change-transform"
              >
                <span className="bg-court-blue rounded-full p-2 text-white">
                  <ArrowRight className="w-4 h-4 -rotate-45 transition-transform duration-300 group-hover:rotate-0" />
                </span>
                <span ref={aboutCtaLabelRef} className="block text-court-blue font-bold text-sm uppercase tracking-wide">
                  About Us
                </span>
              </Link>
              <Link
                href="/shop"
                className="group flex items-center gap-2 border border-white/30 text-white rounded-full px-5 py-2.5 w-fit text-sm font-bold uppercase tracking-wide transition-colors duration-300 hover:bg-lime hover:border-lime hover:text-ink"
              >
                <ShoppingBag className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-6" />
                Shop Gear
              </Link>
            </div>
          </motion.div>

          {/* Player Portrait */}
          <motion.div
            variants={itemVariants}
            className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl group max-w-sm md:max-w-none mx-auto md:mx-0 transition-transform duration-500 hover:scale-[1.02] hover:shadow-lime/5"
          >
             <img
                src="/images/player_portrait_1779705596398.webp"
                alt="Padel Player"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer" loading="lazy" decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </motion.div>
        </motion.div>

        {/* Center/Right Combined: Main Action Shot & Headlines */}
        <div className="md:col-span-9 flex flex-col gap-10 md:gap-12">

          {/* Main Action Shot — masked clip-path reveal + parallax inside the mask (bible #4).
              The fake video play overlay was removed: no video exists, so the affordance lied. */}
          <div
            ref={maskRef}
            className="relative aspect-[16/9] rounded-[30px] md:rounded-[40px] overflow-hidden shadow-2xl"
          >
            <img
              ref={parallaxImgRef}
              src="/images/court_action_landscape_1779705580138.webp"
              alt="Padel Action"
              className="absolute left-0 top-[-10%] w-full h-[120%] object-cover"
              referrerPolicy="no-referrer" loading="lazy" decoding="async"
            />
          </div>

          {/* Headlines Section */}
          <div ref={headlineRef} className="space-y-6 md:space-y-8">
            <div data-about-rise className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-[10px] md:text-xs font-semibold tracking-[0.15em] text-lime uppercase">
              <span>Precision Engineering. Elite Performance.</span>
              <span>Built for the Padel Obsessed</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl md:text-8xl font-display font-extrabold leading-[1] md:leading-[0.9] tracking-tighter uppercase italic">
                <span className="block overflow-hidden">
                  <span data-about-line className="block pr-[0.06em]">Experience Padel</span>
                </span>
                <span className="block overflow-hidden">
                  <span data-about-line className="block text-lime pr-[0.06em]">Like Never Before</span>
                </span>
              </h2>

              <div data-about-rise className="max-w-2xl mt-8 md:mt-12">
                 <p className="font-mono text-[10px] uppercase tracking-widest text-lime mb-4 md:mb-6 inline-block py-1 px-3 border border-lime/30 rounded-full">
                  /// The home of premium padel ///
                </p>
                <p className="text-lg md:text-2xl font-display font-medium text-white/90 leading-relaxed md:leading-relaxed">
                  From racket to court to championship moment — Court Hub Group powers every part of the game. We stock what the pros play with, build the surfaces they win on, and stage the tournaments where careers are made.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
