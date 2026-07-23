'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Route enter transition — template.tsx remounts on every navigation (unlike
// layout.tsx), giving each page an enter-only rise + fade. gsap.from keeps the
// server-rendered HTML visible (no CSS opacity-0 initial state), and clearProps
// removes the wrapper transform once the enter completes so fixed overlays
// (home preloader, headers) stay anchored to the viewport — a transformed
// ancestor would otherwise become their containing block. (The custom cursor
// lives in layout.tsx so it survives navigations without remounting.)
// ScrollTrigger re-measures after the enter (double rAF lets clearProps flush).
// Reduced motion: no tween registers, content is simply visible.
export default function Template({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(wrapperRef.current, {
          opacity: 0,
          y: 24,
          duration: 0.5,
          delay: 0.05,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
          onComplete: () => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => ScrollTrigger.refresh());
            });
          },
        });
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return <div ref={wrapperRef}>{children}</div>;
}
