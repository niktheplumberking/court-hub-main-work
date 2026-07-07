'use client';
import { useState, useEffect, useRef } from 'react';
import ConstructionSection from '@/components/home/ConstructionSection';

// Device-appropriate construction frame sets — mirrors StoryConstructionWrapper.
// Desktop: 150 full-res frames. Mobile: 90 lightweight 540x960 frames (decoding
// the heavy desktop set OOM-crashes iOS Safari). We resolve the device first,
// then preload exactly ONE set.
const DESKTOP_FRAMES = { folder: '/construction-frames', count: 150 };
const MOBILE_FRAMES = { folder: '/construction-frames-mobile', count: 90 };

/**
 * Standalone build-animation for the Construct page: the court-building frame
 * scrub from the original home, with its built-in form hidden (the Construct
 * page has a dedicated WhatsApp configurator below). Self-contained — no Our
 * Story block and no reverse-scroll camera, unlike StoryConstructionWrapper.
 */
export default function ConstructBuildAnimation() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [resolved, setResolved] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Resolve device once on mount so we preload the correct (safe) frame set.
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(media.matches);
    setResolved(true);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Preload the device-appropriate frames into a ref ConstructionSection reads live.
  useEffect(() => {
    if (!resolved) return;
    const { folder, count } = isDesktop ? DESKTOP_FRAMES : MOBILE_FRAMES;
    const images: HTMLImageElement[] = [];
    for (let i = 1; i <= count; i++) {
      const img = new Image();
      img.src = `${folder}/ezgif-frame-${String(i).padStart(3, '0')}.webp`;
      images.push(img);
    }
    imagesRef.current = images;
  }, [resolved, isDesktop]);

  return (
    <ConstructionSection
      isLoaded
      onProgress={() => {}}
      preloadedImages={imagesRef}
      frameCount={isDesktop ? DESKTOP_FRAMES.count : MOBILE_FRAMES.count}
      hideForm
    />
  );
}
