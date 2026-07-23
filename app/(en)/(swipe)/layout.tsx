'use client';
import { useContext, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, type Variants } from 'motion/react';
// Internal Next context — lets us "freeze" the outgoing route's content so it
// stays rendered while it animates out (App Router otherwise unmounts it
// instantly, which would kill the exit half of the swipe).
import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { swipeDirection } from '@/components/swipe/pageOrder';
import { swipeIntent } from '@/components/swipe/swipeIntent';
import { useDirSign } from '@/lib/i18n/LocaleProvider';
import Header from '@/components/home/Header';
import SmoothScroll from '@/components/shared/SmoothScroll';

function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext ?? ({} as never));
  const frozen = useRef(context).current;
  if (!frozen) return <>{children}</>;
  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>;
}

type SwipeCustom = { dir: number; swipe: boolean };

const SPRING = { type: 'spring' as const, stiffness: 320, damping: 32 };

// ONE variants set, branched per-navigation on `swipe`:
//  • swipe === true  → the signature horizontal hero-to-hero SLIDE (only when the
//    user clicks the in-hero arrows; SwipeArrows set swipeIntent just before nav).
//  • swipe === false → a clean FADE with an INSTANT exit (exit duration 0) so the
//    outgoing fixed hero can't flash during the scroll-to-top. Used for every other
//    navigation (side rail, in-hero navbar, product drill-downs).
const variants: Variants = {
  enter: ({ dir, swipe }: SwipeCustom) =>
    swipe ? { x: dir > 0 ? '100%' : '-100%', opacity: 1 } : { x: 0, opacity: 0 },
  center: ({ swipe }: SwipeCustom) =>
    swipe
      ? { x: 0, opacity: 1, transition: { x: SPRING, opacity: { duration: 0.2 } } }
      : { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: ({ dir, swipe }: SwipeCustom) =>
    swipe
      ? { x: dir > 0 ? '-100%' : '100%', opacity: 1, transition: { x: SPRING } }
      : { x: 0, opacity: 0, transition: { duration: 0 } },
};

/**
 * Shared layout for the swipe group (About / Construct / Shop / Contact +
 * product). On client-side navigation between these routes the page slides
 * horizontally (direction derived from PAGE_ORDER) — the signature swipe.
 * Real Next routes underneath, so SEO + shareable URLs are preserved.
 */
export default function SwipeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // RTL mirrors the slide: "forward" moves toward the inline-end, which is
  // visually LEFT in Arabic — multiply the physical x sign accordingly.
  const dirSign = useDirSign();
  // Track the previous path + direction across renders (this layout persists
  // while navigating within the group). Computed at render time so the exiting
  // page already has the right direction.
  const prevPath = useRef(pathname);
  const dir = useRef(1);
  // Whether THIS navigation is an arrow swipe — captured from the shared intent flag
  // the instant the path changes, then reset so the next nav defaults to fade.
  const swipeMode = useRef(false);
  if (pathname !== prevPath.current) {
    dir.current = swipeDirection(prevPath.current, pathname);
    swipeMode.current = swipeIntent.current;
    swipeIntent.current = false;
    prevPath.current = pathname;
  }
  const custom: SwipeCustom = { dir: dir.current * dirSign, swipe: swipeMode.current };

  return (
    // Lenis smooth-scroll for the whole swipe group — one instance, persists
    // across in-group navigations. Uses real (smoothed) scroll, NOT a transform
    // wrapper, so it's safe for the fixed-hero blanket; honors reduced-motion.
    // Framer useScroll (the Construct cross-slide) tracks this smoothed scroll,
    // so the signature transition reads even silkier site-wide.
    <SmoothScroll>
      {/* Single shared navbar — OUTSIDE the transforming wrapper so it stays
          viewport-fixed during the slide (a fixed element inside a transform
          breaks). Navigating between swipe pages via the navbar also triggers
          the swipe. */}
      <Header />
      <AnimatePresence mode="popLayout" initial={false} custom={custom}>
        <motion.div
          key={pathname}
          custom={custom}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transformTemplate={(_, generated) =>
            generated === 'none' || generated === 'translateX(0px)' || generated === 'translateX(0%)'
              ? 'none'
              : generated
          }
          className="min-h-screen w-full bg-ink"
        >
          <FrozenRouter>{children}</FrozenRouter>
        </motion.div>
      </AnimatePresence>
    </SmoothScroll>
  );
}
