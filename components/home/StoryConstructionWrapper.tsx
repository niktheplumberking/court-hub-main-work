'use client';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import OurStorySection, { OurStoryContent, OurStoryVideoBlock } from './OurStorySection';
import ConstructionSection from './ConstructionSection';

gsap.registerPlugin(ScrollTrigger);

// Constants for tuning
// Extended from 490% -> 590%: the extra 100% (one viewport) is given entirely to
// the frame-SCRUB phase below (2.0 -> 3.0), so the construction frames reproduce
// over more scroll = slower, more readable playback. Other phases are unchanged.
const SCROLL_LENGTH = '+=590%';
const FRAME_SMOOTHING = 0.5;

// Device-specific construction frame sets. Desktop uses the full-res 2560x1440
// sequence; mobile uses a dedicated lightweight 540x960 portrait set. This is
// critical for mobile: decoding 150 desktop frames (~2.2GB of bitmap memory)
// crashes iOS Safari ("a problem repeatedly occurred"). The mobile set is
// ~177MB decoded — well within budget.
const DESKTOP_FRAMES = { folder: '/construction-frames-hd', count: 90 };
const MOBILE_FRAMES = { folder: '/construction-frames-mobile-hd', count: 90 };

// Desktop reverse-scroll timeline phase weights (proportioned across SCROLL_LENGTH;
// at +=490% each unit ≈ one viewport height of scroll):
//   DWELL  — Our Story holds full-screen before the reverse scroll begins (so the
//            user gets breathing room instead of an instant flip).
//   TRAVEL — camera slides Construction down into view (the reverse scroll). Its
//            speed is preserved from the original 0.55-of-350% ratio (~0.52 camera
//            vh per scroll vh) so the motion feels exactly as before.
//   SCRUB  — construction frames reproduce, and ONLY once Construction is 100% in
//            view (i.e. after TRAVEL completes).
//   FORM   — the configurator fades in, and ONLY after the final frame has played.
const PHASE_DWELL = 0.5;
const PHASE_TRAVEL = 1.9;
const PHASE_SCRUB = 3.0; // was 2.0 — more scroll distance so frames play ~1.5x slower
const PHASE_FORM = 0.5;

interface StoryConstructionWrapperProps {
  isLoaded: boolean;
  onProgress: (progress: number) => void;
}

export default function StoryConstructionWrapper({ isLoaded, onProgress }: StoryConstructionWrapperProps) {
  // Plain false initial state: the server always renders the mobile branch, so the
  // first client render MUST match it (reading matchMedia in the initializer caused a
  // guaranteed hydration mismatch on desktop). The matchMedia effect below flips this
  // post-mount; the unified preload no longer depends on isDesktop, so nothing regresses.
  const [isDesktop, setIsDesktop] = useState(false);
  // Gates the frame preload until the viewport size is known, so we load exactly
  // ONE device-appropriate frame set (no desktop->mobile double-load, no progress
  // wobble). False on the server and first client render (SSR parity).
  const [deviceResolved, setDeviceResolved] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const cameraWorldRef = useRef<HTMLDivElement>(null);
  const desktopCanvasRef = useRef<HTMLCanvasElement>(null);
  const desktopFormRef = useRef<HTMLDivElement>(null);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);

  // 1. Detect screen size (desktop >= 1024px). Resolves device on mount so the
  //    correct frame set preloads and the right layout renders.
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(media.matches);
    setDeviceResolved(true);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // 2. Preload the device-appropriate construction frame set. Desktop: 150
  //    full-res frames. Mobile: 90 lightweight 540x960 frames (the heavy desktop
  //    set would OOM-crash mobile Safari). Deferred until `isLoaded` (the hero
  //    has finished and the preloader has lifted) so these ~16MB don't compete
  //    with the hero for bandwidth during first paint — the user scrolls through
  //    several sections before reaching construction, so there's ample time.
  useEffect(() => {
    if (!deviceResolved || !isLoaded) return;
    let active = true;
    const { folder, count } = isDesktop ? DESKTOP_FRAMES : MOBILE_FRAMES;
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];
    // Desktop: warm decodes sequentially in the background so they're ready for
    // the reverse-scroll without a concurrent decode storm (which would jank the
    // page while the user is still on the hero/about/shop above).
    let decodeChain: Promise<unknown> = Promise.resolve();

    for (let i = 1; i <= count; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');

      const handleLoad = () => {
        if (!active) return;
        loadedCount++;
        const progress = Math.round((loadedCount / count) * 100);
        onProgress(progress);
      };

      img.onload = () => {
        // Count as ready on download; warm the decode in the background (desktop,
        // sequential). Mobile SKIPS eager decode entirely — decoding hero +
        // construction at once OOM-crashes iOS Safari; mobile decodes lazily on draw.
        handleLoad();
        if (isDesktop && 'decode' in img) {
          decodeChain = decodeChain.then(() => (active ? img.decode().catch(() => {}) : undefined));
        }
      };

      img.onerror = () => {
        if (!active) return; // don't spam the console after unmount/cleanup
        console.error(`Failed to load construction frame: ${frameNum}`);
        handleLoad();
      };

      img.src = `${folder}/ezgif-frame-${frameNum}.webp`;
      images.push(img);
    }
    imagesRef.current = images;

    return () => {
      active = false;
    };
  }, [deviceResolved, isDesktop, isLoaded, onProgress]);

  // 3. Setup GSAP ScrollTrigger Sequence for Desktop
  useEffect(() => {
    if (!isLoaded || !isDesktop || !stageRef.current || !cameraWorldRef.current || !desktopCanvasRef.current) return;

    const canvas = desktopCanvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = 1920;
    canvas.height = 1080;

    const drawFrame = (index: number) => {
      const roundedIndex = Math.min(149, Math.max(0, Math.round(index)));
      const img = imagesRef.current[roundedIndex];
      if (img && img.complete && img.naturalWidth !== 0) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };

    // Draw first frame initially
    drawFrame(0);

    // Visibility observer for video inside stage to autoplay/loop properly
    const video = desktopVideoRef.current;
    if (video) {
      video.play().catch(() => {});
    }

    const ctx = gsap.context(() => {
      const playhead = { frame: 0 };

      // Configurator initial state: hidden AND non-interactive. An opacity:0
      // element still hit-tests, so pointer-events must be off until it actually
      // appears — otherwise the invisible form would silently intercept clicks
      // over the canvas during the dwell/travel/scrub phases.
      gsap.set(desktopFormRef.current, { opacity: 0, y: 60, pointerEvents: 'none' });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: SCROLL_LENGTH,
          pin: true,
          scrub: FRAME_SMOOTHING,
          // No anticipatePin: with Lenis driving scroll, its velocity prediction
          // fires the pin early (mid-deceleration), dumping residual momentum into
          // the last ~10% as an aggressive "push to lock". Pinning exactly at
          // 'top top' lets Lenis settle into the lock smoothly instead.
        }
      });

      // Phase 0 — DWELL: reserve scroll while Our Story stays full-screen, giving
      // the user a few scrolls of breathing room before the reverse scroll. The
      // camera fromTo below uses immediateRender (default), so the -100vh start is
      // applied on creation and simply held through this dwell.
      tl.to({}, { duration: PHASE_DWELL }, 0);

      // Phase A — TRAVEL: camera slides from Our Story (-100vh) up to Construction
      // (0). This is the "reverse scroll"; its speed matches the original. fromTo
      // pins the start value deterministically across forward/backward scrubbing.
      tl.fromTo(cameraWorldRef.current,
        { y: '-100vh' },
        { y: '0px', ease: 'none', duration: PHASE_TRAVEL },
        PHASE_DWELL
      );

      // Phase B — SCRUB: construction frames reproduce, starting ONLY once the
      // camera has fully arrived (Construction 100% in view). Until then the
      // canvas holds frame 0, so sliding the section in never animates frames.
      tl.to(playhead, {
        frame: 149,
        ease: 'none',
        duration: PHASE_SCRUB,
        onUpdate: () => {
          drawFrame(playhead.frame);
        }
      }, PHASE_DWELL + PHASE_TRAVEL);

      // Phase C — FORM: the configurator fades in, starting ONLY after the last
      // frame has played (frames 100% reproduced).
      tl.to(desktopFormRef.current,
        { opacity: 1, y: 0, pointerEvents: 'auto', ease: 'power2.out', duration: PHASE_FORM },
        PHASE_DWELL + PHASE_TRAVEL + PHASE_SCRUB
      );

    }, stageRef);

    // Refresh layout calculations
    ScrollTrigger.refresh();

    // Trigger video play inside ScrollTrigger visibility observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && desktopVideoRef.current) {
            desktopVideoRef.current.play().catch(() => {});
          }
        });
      },
      { threshold: 0.05 }
    );
    if (video) {
      observer.observe(video);
    }

    return () => {
      ctx.revert();
      if (video) {
        observer.disconnect();
      }
    };
  }, [isLoaded, isDesktop]);

  // Trigger ScrollTrigger.refresh() on font load, video metadata load, etc.
  useEffect(() => {
    if (isLoaded && isDesktop) {
      const handleLoad = () => ScrollTrigger.refresh();
      window.addEventListener('load', handleLoad);
      document.fonts.ready.then(handleLoad);
      return () => {
        window.removeEventListener('load', handleLoad);
      };
    }
  }, [isLoaded, isDesktop]);

  return (
    <>
      {/* 1. Mobile & Tablet Layout (<1024px) — stacked, plain scroll. Uses the
          lightweight mobile frame set (90 @ 540x960) to stay within mobile memory. */}
      {!isDesktop && (
        <>
          <OurStorySection />
          <ConstructionSection
            isLoaded={isLoaded}
            onProgress={() => {}} // progress managed by wrapper
            preloadedImages={imagesRef}
            frameCount={MOBILE_FRAMES.count}
          />
        </>
      )}

      {/* 2. Desktop Layout (>= 1024px) - Reverse-direction Scroll Stage */}
      {isDesktop && (
        <>
          {/* Pin Stage */}
          <div 
            ref={stageRef} 
            className="relative w-full h-screen overflow-hidden bg-sand z-10 select-none"
          >
            {/* Camera World (200vh tall container stacked vertically) */}
            <div
              ref={cameraWorldRef}
              data-camera-world
              className="w-full h-[200vh] flex flex-col relative will-change-transform bg-sand"
            >
              {/* Top Layer: ConstructionSection (100vh) */}
              <div className="w-full h-screen relative overflow-hidden bg-sand flex-shrink-0">
                <ConstructionSection 
                  isLoaded={isLoaded} 
                  onProgress={() => {}} 
                  preloadedImages={imagesRef}
                  isDesktop={true}
                  canvasRef={desktopCanvasRef}
                  formRef={desktopFormRef}
                />
              </div>

              {/* Bottom Layer: Our Story video block (100vh) with overlaid text */}
              <div id="story" className="w-full h-screen relative overflow-hidden bg-sand flex-shrink-0">
                <div className="absolute inset-0 w-full h-full z-0">
                  <OurStoryVideoBlock 
                    videoRef={desktopVideoRef} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="relative z-10 h-full flex items-center px-8 text-ink">
                  <div className="max-w-7xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center w-full">
                      <OurStoryContent isDesktop={true} />
                      <div className="hidden lg:block lg:col-span-7" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
