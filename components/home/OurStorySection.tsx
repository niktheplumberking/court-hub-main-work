'use client';
import { useState, useEffect, useRef } from 'react';
const storyVideo = '/fulldoneversion.mp4';
const storyMobileVideo = '/mobileloopvideo.mp4';

export { storyVideo, storyMobileVideo };

// Exported shared story content (text details)
export function OurStoryContent({ isDesktop = false }: { isDesktop?: boolean }) {
  return (
    <div className={`space-y-4 md:space-y-12 z-10 ${
      isDesktop 
        ? 'lg:col-span-5' 
        : 'lg:col-span-5 bg-white/75 backdrop-blur-md py-4 px-5 rounded-[24px] border border-white/30 shadow-lg md:relative md:top-auto md:left-auto md:right-auto md:bg-transparent md:backdrop-blur-none md:p-0 md:rounded-none md:border-none md:shadow-none'
    }`}>
      <div className="space-y-4 md:space-y-6">
        <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.25em] text-court-blue font-bold">
          /// Our Story ///
        </p>

        <h2 className="text-2xl md:text-7xl font-display font-extrabold leading-[0.95] tracking-tighter uppercase italic text-ink">
          Crafted <br />
          For The <br />
          <span className="text-court-blue">Obsessed.</span>
        </h2>
      </div>

      <div className="space-y-4 md:space-y-6">
        <p className="text-xs md:text-lg leading-relaxed text-ink/80 font-normal">
          We believe padel is more than just a sport, it is a pursuit of pure precision, relentless speed, and the raw joy of the perfect shot. From our hand-laid court surfaces to the balanced carbon core of our rackets, Court Hub is built by players, for players.
        </p>
        <p className="text-[11px] md:text-base leading-relaxed text-ink/70 font-light">
          Every detail is engineered to perform at the highest level. We source the finest materials, collaborate with world-class engineers, and design for those who live and play with passion.
        </p>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 pt-4 md:pt-6 border-t border-ink/10">
        <div className="space-y-1 md:space-y-2">
          <span className="font-mono text-[9px] md:text-xs text-court-blue font-bold">01 / CARBON</span>
          <h4 className="font-display font-bold text-xs md:text-sm uppercase">Elite Fiber</h4>
          <p className="text-[10px] md:text-[11px] text-ink/60 leading-snug">Premium Japanese carbon weave for responsive stiffness.</p>
        </div>
        <div className="space-y-1 md:space-y-2">
          <span className="font-mono text-[9px] md:text-xs text-court-blue font-bold">02 / GEOMETRY</span>
          <h4 className="font-display font-bold text-xs md:text-sm uppercase">Optimized Sweetspot</h4>
          <p className="text-[10px] md:text-[11px] text-ink/60 leading-snug">Aerodynamic frame layouts maximizing power transfer.</p>
        </div>
        <div className="space-y-1 md:space-y-2">
          <span className="font-mono text-[9px] md:text-xs text-court-blue font-bold">03 / SURFACES</span>
          <h4 className="font-display font-bold text-xs md:text-sm uppercase">Elite Courts</h4>
          <p className="text-[10px] md:text-[11px] text-ink/60 leading-snug">Multi-layered shock-absorbing court engineering.</p>
        </div>
      </div>
    </div>
  );
}

// Exported video block for the desktop stage (accepts custom className and ref)
export function OurStoryVideoBlock({ className = '', videoRef }: { className?: string; videoRef?: React.RefObject<HTMLVideoElement | null> }) {
  return (
    <div className={`relative w-full h-full overflow-hidden bg-sand ${className}`}>
      <video 
        ref={videoRef}
        src={storyVideo}
        autoPlay
        loop
        muted
        playsInline
        poster="/images/our_story_racket.jpg"
        onEnded={(e) => {
          e.currentTarget.play().catch(() => {});
        }}
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          if (video.duration && video.currentTime >= video.duration - 0.2) {
            video.currentTime = 0;
            video.play().catch(() => {});
          }
        }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />
      {/* Sand wash (was bg-white/15, which lightened the sky cooler than the
          rest of the site). Tints the video's cream sky toward the exact sand
          used by Construction / FAQ so the sections read as one tone. */}
      <div className="absolute inset-0 bg-sand/20 pointer-events-none z-0" />
    </div>
  );
}

export default function OurStorySection() {
  const [videoSrc, setVideoSrc] = useState(storyVideo);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Dynamic responsive video source selection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVideoSrc(storyMobileVideo);
      } else {
        setVideoSrc(storyVideo);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Autoplay, intersection-based viewport trigger, and visibility recovery to ensure infinite looping
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {
              /* autoplay can be rejected on throttled/mobile tabs — safe to ignore */
            });
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(video);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
    };
  }, [videoSrc]);

  return (
    <section 
      id="story" 
      className="relative min-h-[110vh] md:min-h-screen pt-16 pb-20 md:py-32 px-4 md:px-8 bg-sand text-ink z-20 flex items-start md:items-center overflow-hidden"
    >
      {/* HTML5 Infinite Loop Video Background */}
      <video 
        ref={videoRef}
        key={videoSrc}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        poster="/images/our_story_racket.jpg"
        onEnded={(e) => {
          e.currentTarget.play().catch(() => {});
        }}
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          if (video.duration && video.currentTime >= video.duration - 0.2) {
            video.currentTime = 0;
            video.play().catch(() => {});
          }
        }}
        className="absolute inset-0 w-full h-full object-cover object-bottom md:object-center z-0 pointer-events-none"
      />

      {/* Sand wash (was bg-white/15, which lightened the sky cooler than the
          rest of the site). Tints the video's cream sky toward the exact sand
          used by Construction / FAQ so the sections read as one tone. */}
      <div className="absolute inset-0 bg-sand/20 pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          <OurStoryContent isDesktop={false} />
          <div className="hidden lg:block lg:col-span-7" />
        </div>
      </div>
    </section>
  );
}

