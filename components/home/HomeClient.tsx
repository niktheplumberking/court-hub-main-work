'use client';
import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'motion/react';
import type { Product } from '@/lib/types';

import { hasClientNavigated } from '@/components/shared/NavigationFlag';

import Header from './Header';
import Hero from './Hero';
import AboutSection from './AboutSection';
import ShopSection from './ShopSection';
import StoryConstructionWrapper from './StoryConstructionWrapper';
import FAQSection from './FAQSection';
import Footer from './Footer';

gsap.registerPlugin(ScrollTrigger);

interface HomeClientProps {
  /** Real products fetched server-side (app/page.tsx); empty = ShopSection fallback. */
  products?: Product[];
}

export default function App({ products = [] }: HomeClientProps) {
  const [heroProgress, setHeroProgress] = useState(0);
  const [constructionProgress, setConstructionProgress] = useState(0);

  // The preloader gates on the HERO only — it's the first thing on screen. The
  // construction frames load lazily afterwards (the user scrolls through About,
  // Shop and Our Story before reaching them), so blocking the loader on ~16MB of
  // construction frames just slowed the first paint for no benefit.
  const totalProgress = heroProgress;
  const assetsLoaded = heroProgress === 100;

  // Show the preloader ONLY on a genuine first/external landing on the homepage.
  // If the user has already navigated within the app this session (e.g. arrived
  // here from /shop or /about), skip the intro entirely — the loader must not pop
  // on internal navigation. Computed once at mount (render time) so it's read
  // after NavigationFlag has recorded the current route; constant thereafter.
  const [skipIntro] = useState(() => hasClientNavigated());

  // "Ready" gates the overlay, the scroll lock, and the hero/stage GSAP setups.
  // On internal nav skipIntro short-circuits it true so everything is live
  // immediately (frames are already in the browser cache from the first visit).
  const ready = assetsLoaded || skipIntro;

  // Lock scroll only while the (first-landing) preloader is on screen.
  useEffect(() => {
    if (!ready) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [ready]);

  useEffect(() => {
    // Initialize Lenis smooth scroll with luxurious deceleration and responsive multipliers
    const lenis = new Lenis({
      lerp: 0.1, // gentle, not slow — page settles ~150-250ms after the wheel stops
      duration: 1.2, // applies to scrollTo (anchor) animations
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      syncTouch: false,
    });

    // Drive ScrollTrigger from the same rAF that advances Lenis, AFTER Lenis
    // updates — this guarantees ScrollTrigger reads the current frame's smoothed
    // scroll position, not the previous frame's. (Using lenis.on('scroll', …)
    // instead can leave ScrollTrigger one frame stale at a pin boundary, which
    // shows up as a jerk when a pinned section locks mid-deceleration.)
    const updateRaf = (time: number) => {
      lenis.raf(time * 1000);
      ScrollTrigger.update();
    };
    gsap.ticker.add(updateRaf);
    gsap.ticker.lagSmoothing(0);

    // Intercept anchor clicks for smooth scrolling
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        if (targetId) {
          // force: true — a stopped Lenis (mobile menu open → body overflow:hidden
          // → observer calls lenis.stop()) silently ignores scrollTo otherwise,
          // making every section link in the mobile menu a dead tap.
          lenis.scrollTo(targetId, { force: true });
        }
      }
    };
    document.documentElement.addEventListener('click', handleAnchorClick);

    // Synchronize body overflow state with Lenis (pauses smooth scrolling when overflow is hidden)
    const checkOverflow = () => {
      if (document.body.style.overflow === 'hidden') {
        lenis.stop();
      } else {
        lenis.start();
      }
    };
    checkOverflow();

    const observer = new MutationObserver(checkOverflow);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

    return () => {
      lenis.destroy();
      gsap.ticker.remove(updateRaf);
      document.documentElement.removeEventListener('click', handleAnchorClick);
      observer.disconnect();
    };
  }, []);

  return (
    <main className="relative min-h-screen">
      {/* Elegant Unified Preloader Screen — first/external landing only */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            data-preloader
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center px-6 touch-none"
          >
            <div className="text-center space-y-6 max-w-md w-full">
              <motion.h2 
                animate={{ opacity: [0.5, 1, 0.5] }} 
                transition={{ duration: 2, repeat: Infinity }}
                className="text-white text-2xl md:text-4xl font-display font-semibold tracking-[0.15em] uppercase"
              >
                Court Hub
              </motion.h2>
              <p className="text-white/40 text-[10px] md:text-sm font-mono tracking-widest uppercase">
                Loading High-Res 3D Models...
              </p>
              
              {/* Progress Bar Container */}
              <div className="relative w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-lime transition-all duration-300 ease-out shadow-[0_0_10px_#3B82F6]"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              
              {/* Percentage Indicator */}
              <div className="text-lime font-mono text-sm md:text-base font-semibold">
                {totalProgress}%
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header />
      <Hero isLoaded={ready} onProgress={setHeroProgress} />
      {/* Blanket wrapper that slides up over the fixed Hero section */}
      <div className="relative z-20 shadow-[0_-30px_60px_rgba(0,0,0,0.8)] bg-court-blue -mt-[100vh] md:pl-24">
        <AboutSection />
        <ShopSection products={products} />
        <StoryConstructionWrapper isLoaded={ready} onProgress={setConstructionProgress} />
        <FAQSection />
        <Footer />
      </div>
    </main>
  );
}

