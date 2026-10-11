'use client';
import { useEffect } from 'react';

/**
 * Drives the service cards' interactive glow (styles: .ch-svc in globals.css).
 * - Pointer: the spotlight follows the cursor (--mx / --my on the card).
 * - Touch: a tap lights the card up (.is-touched) for a moment before the
 *   link navigates, so phones get the same "pop and glow" as desktop.
 * One delegated listener for all cards; renders nothing.
 */
export default function SvcSpotlight() {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest<HTMLElement>('.ch-svc');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      const card = (e.target as Element | null)?.closest<HTMLElement>('.ch-svc');
      if (!card) return;
      move(e);
      card.classList.add('is-touched');
      window.setTimeout(() => card.classList.remove('is-touched'), 900);
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerdown', down, { passive: true });
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerdown', down);
    };
  }, []);
  return null;
}
