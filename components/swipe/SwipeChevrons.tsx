'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { neighbors } from './pageOrder';
import { swipeIntent } from './swipeIntent';

const MotionLink = motion.create(Link);

const CHEVRON_CLASS =
  'absolute top-1/2 -translate-y-1/2 z-40 w-8 h-8 md:w-11 md:h-11 rounded-full border border-white/25 bg-black/50 text-white flex items-center justify-center backdrop-blur-md transition-shadow shadow-[0_4px_24px_rgba(0,0,0,0.6)] group shrink-0';

/**
 * The hero frame's prev/next page arrows — ONE component for every page in the
 * swipe cycle so hrefs always follow PAGE_ORDER. Clicking sets `swipeIntent`
 * right before navigation, which is what makes the layout play the signature
 * horizontal hero-to-hero SLIDE instead of the default fade.
 */
export default function SwipeChevrons() {
  const pathname = usePathname();
  const n = neighbors(pathname);
  if (!n) return null;

  const markSwipe = () => {
    swipeIntent.current = true;
  };

  return (
    <>
      <MotionLink
        href={n.prev}
        onClick={markSwipe}
        whileHover={{ scale: 1.15, backgroundColor: '#C8FF3D', color: '#0E0E0C' }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={`${CHEVRON_CLASS} left-2.5 sm:left-4`}
        aria-label="Previous Page"
      >
        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-0.5 transition-transform" />
      </MotionLink>

      <MotionLink
        href={n.next}
        onClick={markSwipe}
        whileHover={{ scale: 1.15, backgroundColor: '#C8FF3D', color: '#0E0E0C' }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={`${CHEVRON_CLASS} right-2.5 sm:right-4`}
        aria-label="Next Page"
      >
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-0.5 transition-transform" />
      </MotionLink>
    </>
  );
}
