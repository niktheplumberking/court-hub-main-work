'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Client-side navigation for the outro CTA (a plain motion.a forces a full reload)
const MotionLink = motion.create(Link);

interface HeroProps {
  isLoaded: boolean;
  onProgress: (progress: number) => void;
}

export default function Hero({ isLoaded, onProgress }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  const [viewportHeight, setViewportHeight] = useState('100vh');
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Hoisted draw helper so BOTH the preload effect and the canvas-setup effect
  // can paint a frame. Critical for client-side BACK navigation: there the
  // preloader is skipped (isLoaded is already true at mount), so the canvas
  // effect's single drawFrame(0) no-ops because frame 0 isn't .complete yet.
  // The preload effect repaints frame 0 the moment it decodes (see below).
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    // Ensure backing-store dimensions match the optimized WebPs (idempotent).
    if (canvas.width !== 1924 || canvas.height !== 1076) {
      canvas.width = 1924;
      canvas.height = 1076;
    }
    const roundedIndex = Math.round(index);
    const img = imagesRef.current[roundedIndex];
    if (img && img.complete && img.naturalWidth !== 0) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Lock viewport height on mobile to prevent layout shifts on address bar collapse
  useEffect(() => {
    let initialWidth = window.innerWidth;
    const lockHeight = () => {
      if (window.innerWidth !== initialWidth) {
        initialWidth = window.innerWidth;
        setViewportHeight(`${window.innerHeight}px`);
      }
    };
    setViewportHeight(`${window.innerHeight}px`);
    window.addEventListener('resize', lockHeight);
    return () => window.removeEventListener('resize', lockHeight);
  }, []);

  // 1. Preload images (Hybrid Loading Strategy: load critical frames first, then load remaining in background)
  useEffect(() => {
    let active = true;
    const isMobile = window.innerWidth < 768;
    const frameCount = isMobile ? 60 : 120;
    const folderPath = isMobile ? '/court-hub-heroframes-mobile' : '/frames';

    let loadedCount = 0;
    const images: HTMLImageElement[] = [];
    // Publish the array reference up front so the synchronous cache-hit draw of
    // frame 0 (below) sees the pushed image immediately; subsequent pushes
    // mutate this same array. (Reassigned again after the loop is harmless.)
    imagesRef.current = images;
    // Desktop: warm decodes SEQUENTIALLY in the background (a chained queue) so
    // frames are ready ahead of the scroll without a concurrent decode storm.
    let decodeChain: Promise<unknown> = Promise.resolve();

    // Preload all frames
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');

      const handleLoad = () => {
        if (!active) return;
        loadedCount++;
        const progress = Math.round((loadedCount / frameCount) * 100);
        onProgress(progress);
      };

      const isFirstFrame = i === 1;

      img.onload = () => {
        // Gate the loader on DOWNLOAD, not decode. Blocking the preloader on 120
        // frame-decodes kept it on screen several times longer than the actual
        // download. Count the frame as ready on load; warm its decode in the
        // background (desktop only, sequential — see decodeChain). Mobile skips
        // decode entirely (lazy on first draw) to avoid an iOS-Safari OOM spike.
        handleLoad();
        // On client-side BACK navigation the preloader/intro is skipped, so the
        // canvas-setup effect's single drawFrame(0) ran before frame 0 was
        // .complete and no-opped. Repaint frame 0 the instant it's decodable.
        if (isFirstFrame && active) drawFrame(0);
        if (!isMobile && 'decode' in img) {
          decodeChain = decodeChain.then(() => (active ? img.decode().catch(() => {}) : undefined));
        }
      };

      img.onerror = () => {
        if (!active) return;
        console.error(`Failed to load frame: ${frameNum}`);
        handleLoad();
      };

      img.src = `${folderPath}/ezgif-frame-${frameNum}.webp`;
      images.push(img);
      // Cover the HTTP-cache-hit case (common on back-nav): onload may not fire
      // for an already-cached image, so paint frame 0 immediately if it's ready.
      // (Pushed above first so drawFrame's imagesRef.current[0] lookup resolves.)
      if (isFirstFrame && active && img.complete) drawFrame(0);
    }
    imagesRef.current = images;

    return () => {
      active = false;
    };
  }, []);

  // 2. Setup GSAP ScrollTrigger Canvas Sequence
  useEffect(() => {
    if (!isLoaded || !canvasRef.current || !containerRef.current) return;

    const isMobile = window.innerWidth < 768;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas dimensions matching the optimized WebPs for hardware-accelerated 1:1 draw performance
    canvas.width = 1924;
    canvas.height = 1076;

    // Draw first frame initially (uses hoisted drawFrame; on back-nav frame 0
    // may not be .complete yet — the preload effect repaints it once decodable)
    drawFrame(0);

    // Create a GSAP Context for clean react scoped cleanup
    const ctx = gsap.context(() => {
      const playhead = { frame: 0 };

      // Main scrollytelling timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: window.innerWidth < 768 ? 0.3 : 0.8, // Ultra-responsive mobile touch finger scrolling
        }
      });

      // Frame animation scrubbing (ends at 3.0)
      const frameCount = isMobile ? 60 : 120;
      tl.to(playhead, {
        frame: frameCount - 1,
        snap: { frame: 1 },
        ease: 'none',
        duration: 3, // Duration relative to timeline beats
        onUpdate: () => {
          drawFrame(playhead.frame);
        }
      }, 0);

      // --- TEXT CHOREOGRAPHY ---

      // Phase 1: Intro Text (Starts fully visible, fades out as we start scrolling)
      tl.to(introRef.current, {
        opacity: 0,
        y: -40,
        scale: 0.98,
        ease: 'sine.inOut',
        duration: 0.6
      }, 0);

      // Phase 2: Tagline & Users Pill (Fades in)
      tl.fromTo(taglineRef.current, 
        { opacity: 0, y: 40, scale: 0.97 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          ease: 'sine.out', 
          duration: 0.8 
        },
        0.5
      );
      
      // Phase 2: Tagline & Users Pill (Fades out)
      tl.to(taglineRef.current, {
        opacity: 0,
        y: -40,
        scale: 0.98,
        ease: 'sine.in',
        duration: 0.8
      }, 1.5);

      // Phase 3: Outro CTA (Fades in at the end of the frame sequences)
      tl.fromTo(outroRef.current,
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: 'sine.out',
          duration: 0.8
        },
        2.2
      );

      // Bottom scroll indicator fade out
      tl.to(scrollIndicatorRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.4
      }, 0.1);

      // Extend the timeline to 4.5 seconds to reserve the final 33% of scroll
      // for the static/fixed frame phase while the blanket section slides up
      tl.to({}, { duration: 1.5 }, 3.0);

    }, containerRef);

    return () => ctx.revert();
    // drawFrame is memoized (stable identity), so this effect still only re-runs
    // on isLoaded changes — no second ScrollTrigger registration is introduced.
  }, [isLoaded, drawFrame]);

  return (
    <div className="relative">

      {/* 2. Hero Scroll Container (400% viewport height for optimal scroll distance) */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        ref={containerRef}
        className="relative w-full h-[400vh] bg-black"
      >
        {/* Pinned Viewport Frame Wrapper. Mobile uses h-[100dvh] (the DYNAMIC viewport)
            so the fixed frame always fills the visible area and adapts as Safari's address
            bar collapses — the old JS-locked window.innerHeight was captured while the bar
            was still expanded on a FRESH load, leaving a gap at the bottom where the section's
            static bg showed through (it only looked fine on client-nav because the bar was
            already collapsed then). */}
        <div
          className="fixed md:sticky top-0 left-0 w-full h-[100lvh] md:h-screen overflow-hidden flex flex-col justify-between bg-black"
        >
          
          {/* Canvas Render Target */}
          <motion.canvas 
            ref={canvasRef} 
            initial={{ scale: 1.12 }}
            animate={isLoaded ? { scale: 1 } : { scale: 1.12 }}
            transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          {/* Premium Ambient Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 z-10 pointer-events-none" />

          {/* Phase 1: Intro Headline */}
          <div 
            ref={introRef}
            className="absolute inset-0 z-20 flex flex-col justify-start md:justify-end pt-28 md:pt-0 pb-0 md:pb-28 px-6 md:px-16 pointer-events-none select-none"
          >
            <div className="max-w-[1800px] mx-auto w-full space-y-6 md:space-y-8">
              <div>
                <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/5 text-white/50 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em]">
                  Elite Padel Engineering
                </span>
              </div>
              <div className="ch-levitate">
                <h1 className="text-white text-[10vw] md:text-[100px] font-display font-medium leading-[1] md:leading-[0.92] tracking-[-0.035em]">
                  Your Game, Your Style – <br />
                  Modern Padel Courts <br className="hidden md:block" />
                  for Every Level
                </h1>
              </div>
            </div>
          </div>

          {/* Phase 2: Tagline & Community Info */}
          <div 
            ref={taglineRef}
            className="absolute inset-0 z-20 flex flex-col justify-end md:justify-start pb-24 md:pb-0 md:pt-40 px-6 md:px-16 pointer-events-none select-none opacity-0"
          >
            <div className="max-w-[1800px] mx-auto w-full flex flex-col items-center md:items-start text-center md:text-left space-y-6 md:space-y-8">
              {/* Overlapping User Avatars Badge */}
              <div className="inline-flex items-center p-1.5 px-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                <div className="flex -space-x-3">
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
                  ].map((src, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-black overflow-hidden bg-black shadow-2xl">
                      <img src={src} alt="player avatar" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="ml-3 text-white text-xs md:text-sm font-medium tracking-tight pr-2">
                  Over 5,000 active court players
                </span>
              </div>

              <p className="text-white text-lg md:text-[22px] leading-[1.3] font-normal tracking-tight max-w-sm opacity-90 mx-auto md:mx-0">
                Experience excellence across <br className="hidden md:block" />
                every arena and build new bonds.
              </p>
            </div>
          </div>

          {/* Phase 3: Outro Call to Action */}
          <div 
            ref={outroRef}
            className="absolute inset-0 z-20 flex flex-col items-center md:items-end justify-center px-6 md:px-24 pointer-events-none select-none opacity-0"
          >
            <div className="text-center md:text-right space-y-6 max-w-xl pointer-events-auto select-none float-effect">
              <div className="flex justify-center md:justify-end">
                <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md text-lime text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] rounded-full border border-lime/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  Tour-Ready Arenas
                </span>
              </div>
              <h2 className="text-4xl md:text-8xl font-display font-extrabold uppercase italic leading-[1] md:leading-[0.9] tracking-tighter text-white">
                Step Onto <br />
                <span className="text-lime">The Court</span>
              </h2>
              <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-md mx-auto md:ml-auto">
                Scroll down to experience our world-class court builds, engineered surfaces, and pro-level academies.
              </p>
              <div className="flex justify-center md:justify-end pt-4">
                <MotionLink
                  href="/construct-your-court"
                  whileHover={{ scale: 1.05, backgroundColor: "#ffffff", color: "#0A2A66", boxShadow: "0 0 25px rgba(255,255,255,0.25)" }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 px-8 py-4 bg-lime text-ink font-bold uppercase tracking-[0.15em] text-[11px] rounded-full shadow-lg transition-colors duration-300 pointer-events-auto cursor-pointer"
                >
                  Build Your Court
                  <ArrowUpRight className="w-4 h-4" />
                </MotionLink>
              </div>
            </div>
          </div>

          {/* Top Header Placeholder spacing */}
          <div className="h-20 w-full" />

          {/* Bottom initial scroll indicator (fades out as user scrolls) */}
          <div 
            ref={scrollIndicatorRef}
            className="w-full z-20 pb-8 flex flex-col items-center justify-center gap-2 text-white/40 pointer-events-none select-none"
          >
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-semibold">Scroll to Orbit</span>
            <div className="w-7 h-12 border border-white/20 rounded-full p-1.5 flex justify-center">
              <div className="w-1.5 h-3 bg-lime rounded-full animate-bounce mt-1" />
            </div>
          </div>

        </div>
      </motion.section>
    </div>
  );
}

