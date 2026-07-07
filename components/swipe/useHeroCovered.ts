'use client';
import { useEffect, useState } from 'react';

/**
 * True once the blanket content has fully covered a page's FIXED hero
 * (one viewport + a small buffer). Used to `visibility: hidden` the hero so
 * the browser stops painting/compositing a huge blurred, animating layer
 * that can no longer be seen — a large chunk of the site's scroll cost.
 */
export function useHeroCovered() {
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const onScroll = () => setCovered(window.scrollY >= window.innerHeight + 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return covered;
}
