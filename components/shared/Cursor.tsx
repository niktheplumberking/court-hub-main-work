'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

// Custom cursor: 8px lime dot + 36px trailing ring (mix-blend-difference).
// The ring's 0.55s lag against the dot's 0.2s is intentional — the lag is the luxury.
// Renders NOTHING on coarse pointers, under prefers-reduced-motion, or when
// window.matchMedia is unavailable; native cursor stays untouched in those cases.
// While active it toggles .has-custom-cursor on <body> (globals.css hides the native
// cursor for fine pointers only, with cursor:auto preserved on form fields).

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, select, textarea, label';

// Fields where the native cursor should win (I-beam on text entry, default
// arrow on selects — globals.css restores cursor:auto on all three) — hide
// dot + ring entirely so they never double up with the native cursor.
function isTextField(interactive: Element): boolean {
  if (interactive instanceof HTMLSelectElement) return true;
  if (interactive.matches('textarea, select')) return true;
  if (!interactive.matches('input')) return false;
  const type = (interactive.getAttribute('type') || 'text').toLowerCase();
  return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image'].includes(type);
}

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Gate on environment BEFORE mounting anything: fine pointer + motion allowed only.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnabled(finePointer.matches && !reducedMotion.matches);
    update();
    finePointer.addEventListener('change', update);
    reducedMotion.addEventListener('change', update);
    return () => {
      finePointer.removeEventListener('change', update);
      reducedMotion.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Mutable flags live outside React — no state updates per pointer event.
    // NOTE: .has-custom-cursor is NOT added here. On mount/remount the last
    // pointer position is unknown and dot/ring sit at autoAlpha 0 — hiding the
    // native cursor now would leave the user with no cursor at all. The body
    // class is toggled inside syncVisibility, so the native cursor only hides
    // once the first pointermove has placed the custom one.
    let pointerInPage = false;
    let hiddenForText = false;

    const ctx = gsap.context(() => {
      gsap.set([dot, ring], { xPercent: -50, yPercent: -50, autoAlpha: 0 });

      const dotX = gsap.quickTo(dot, 'x', { duration: 0.2, ease: 'power3' });
      const dotY = gsap.quickTo(dot, 'y', { duration: 0.2, ease: 'power3' });
      const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
      const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });
      // quickTo can't resetTo() compound properties like 'scale' (it warns and
      // re-inits every call) — drive scaleX/scaleY individually instead.
      const ringScaleX = gsap.quickTo(ring, 'scaleX', { duration: 0.3, ease: 'power2.out' });
      const ringScaleY = gsap.quickTo(ring, 'scaleY', { duration: 0.3, ease: 'power2.out' });
      const ringScale = (v: number) => {
        ringScaleX(v);
        ringScaleY(v);
      };

      const syncVisibility = () => {
        // Body class follows pointer presence (not hiddenForText: over form
        // fields globals.css already restores the native cursor on the field
        // itself), guaranteeing some cursor is always visible.
        document.body.classList.toggle('has-custom-cursor', pointerInPage);
        gsap.to([dot, ring], {
          autoAlpha: pointerInPage && !hiddenForText ? 1 : 0,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      };

      const onPointerMove = (e: PointerEvent) => {
        dotX(e.clientX);
        dotY(e.clientY);
        ringX(e.clientX);
        ringY(e.clientY);
        if (!pointerInPage) {
          pointerInPage = true;
          syncVisibility();
        }
      };

      // Delegated hover state: recomputed on every pointerover, so leaving an
      // interactive element resets the ring without separate pointerout tracking.
      const onPointerOver = (e: PointerEvent) => {
        const target = e.target instanceof Element ? e.target : null;
        const interactive = target?.closest(INTERACTIVE_SELECTOR) ?? null;
        const overTextField = interactive !== null && isTextField(interactive);
        if (overTextField !== hiddenForText) {
          hiddenForText = overTextField;
          syncVisibility();
        }
        ringScale(interactive && !overTextField ? 1.5 : 1);
      };

      const onPointerLeave = () => {
        pointerInPage = false;
        syncVisibility(); // re-shown by the next pointermove
      };

      document.addEventListener('pointermove', onPointerMove, { passive: true });
      document.addEventListener('pointerover', onPointerOver, { passive: true });
      document.documentElement.addEventListener('pointerleave', onPointerLeave);

      return () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerover', onPointerOver);
        document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      };
    });

    return () => {
      document.body.classList.remove('has-custom-cursor');
      ctx.revert();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[10020] h-9 w-9 rounded-full border border-white/30 opacity-0 mix-blend-difference"
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[10020] h-2 w-2 rounded-full bg-lime opacity-0"
      />
    </>
  );
}
