'use client';
import { useEffect, useRef } from 'react';

/**
 * Minimal scroll-into-view reveal (opacity/translate via .ch-reveal in
 * globals.css). Sections stay server components — they just wrap blocks in
 * this tiny client shell. Reduced motion: the CSS media query renders
 * everything visible, so the observer flipping .in is a harmless no-op.
 */
export default function Reveal({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in');
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`ch-reveal ${className}`}>
      {children}
    </div>
  );
}
