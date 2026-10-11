'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import TennisBall from '@/components/shared/TennisBall';
import { stripLocale } from '@/lib/i18n/locale';
import { useT } from '@/lib/i18n/LocaleProvider';

/**
 * Tennis-ball scroll indicator (client idea): a ball rolls down a slim court
 * line on the inline-end edge as the page scrolls — real rolling, rotation
 * matches distance travelled. Clicking the line jumps to that point of the
 * page. Lives opposite the desktop side rail; hidden in the admin and on
 * pages too short to scroll. Transform-only updates, one rAF per frame.
 */
export default function TennisBallScroll() {
  const t = useT();
  const path = stripLocale(usePathname());
  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  const trackRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    if (isAdmin) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const track = trackRef.current;
      const ball = ballRef.current;
      if (!track || !ball) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollable(max > 240);
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const room = track.clientHeight - ball.clientHeight;
      const y = p * room;
      const spin = (y / (Math.PI * ball.clientWidth)) * 360; // true rolling
      ball.style.transform = `translate3d(0, ${y}px, 0) rotate(${spin}deg)`;
      track.style.setProperty('--ch-ball-p', String(p));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Content that loads late (images, client sections) changes page height.
    const ro = new ResizeObserver(onScroll);
    ro.observe(document.body);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isAdmin, path]);

  if (isAdmin) return null;

  const jump = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: p * max, behavior: 'smooth' });
  };

  return (
    <div
      ref={trackRef}
      onClick={jump}
      role="presentation"
      title={t.courtMap.scrollHint}
      className={`ch-ball-track fixed z-[55] end-0.5 md:end-4 top-1/2 -translate-y-1/2 h-[34vh] md:h-[40vh] w-4 md:w-8 cursor-pointer transition-opacity duration-500 ${
        scrollable ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <span aria-hidden className="ch-ball-line" />
      <span aria-hidden className="ch-ball-fill" />
      <span aria-hidden className="ch-ball-tick top-0" />
      <span aria-hidden className="ch-ball-tick bottom-0" />
      <div ref={ballRef} className="absolute top-0 left-1/2 -ml-[8px] md:-ml-[11px] w-4 h-4 md:w-[22px] md:h-[22px] will-change-transform">
        <TennisBall className="w-full h-full drop-shadow-[0_3px_6px_rgba(6,26,68,0.45)]" />
      </div>
    </div>
  );
}
