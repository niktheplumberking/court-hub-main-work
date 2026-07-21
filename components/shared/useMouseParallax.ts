import { useMotionValue, useSpring } from 'motion/react';
import { useEffect } from 'react';

/**
 * Tracks the cursor and returns spring-smoothed coordinates that move OPPOSITE
 * the pointer — immersive depth/parallax for backgrounds and hero media.
 * Ported from the design project. Client-only (uses window); only import from
 * 'use client' components. No-ops on touch / when window is unavailable.
 *
 * @param intensity max pixel displacement in each axis.
 */
export function useMouseParallax(intensity: number = 24) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 60, damping: 25, mass: 0.8 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Pointer-fine only — skip on touch to save work and avoid jank.
    if (!window.matchMedia('(pointer: fine)').matches) return;
    // Honor reduced-motion: no listener, no spring rAF, backgrounds stay put.
    // (This is a background-shift-on-mouse effect — exactly the kind of motion
    // reduced-motion users opt out of — and it removes real per-frame work.)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      if (!innerWidth || !innerHeight) return;
      const ratioX = e.clientX / innerWidth - 0.5;
      const ratioY = e.clientY / innerHeight - 0.5;
      x.set(-ratioX * intensity);
      y.set(-ratioY * intensity);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [x, y, intensity]);

  return { x: springX, y: springY };
}
