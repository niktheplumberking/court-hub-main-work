'use client';
import Link from 'next/link';
import { motion } from 'motion/react';

/**
 * THE site top navbar (one of the only two nav versions, with the left rail):
 * COURT HUB logo · About Us / Construct Your Court / Shop / Contact Us · Book a Court.
 * Two placements:
 *  • default — lives INSIDE a page's glass-frame hero (home + the swipe pages)
 *    and scrolls away with it; the global left rail takes over past the hero.
 *  • fixedBar — viewport-fixed bar for pages WITHOUT a hero (Shop): same row,
 *    no frame, visible at all times.
 */
type ActiveKey = 'home' | 'about' | 'construct' | 'shop' | 'contact';

const LINKS: { label: string; href: string; key: ActiveKey }[] = [
  { label: 'Home', href: '/', key: 'home' },
  { label: 'About Us', href: '/about', key: 'about' },
  { label: 'Construct Your Court', href: '/construct-your-court', key: 'construct' },
  { label: 'Shop', href: '/shop', key: 'shop' },
  { label: 'Contact Us', href: '/contact', key: 'contact' },
];

export default function HeroFrameNav({
  active,
  fixedBar = false,
}: {
  active?: ActiveKey;
  fixedBar?: boolean;
}) {
  return (
    <motion.div
      // initial=false → renders visible immediately (no dependence on the enter tween
      // completing); guarantees the in-frame navbar always shows over the hero.
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      // Hidden on mobile — the global top bar (hamburger + logo) covers nav there, and
      // the hero's own bottom CTAs cover "Book a Court"; this removes the duplicate logo
      // and frees vertical space so the hero fits the phone viewport.
      className={
        fixedBar
          ? 'fixed top-0 left-0 right-0 z-50 hidden md:flex items-center justify-between px-6 lg:px-10 py-4 bg-ink/85 backdrop-blur-md border-b border-white/10'
          : 'relative z-30 w-full hidden md:flex items-center justify-between border-b border-white/15 pb-4 md:pb-6'
      }
    >
      {/* Logo */}
      <Link
        href="/"
        className="text-left flex items-center select-none font-sans shrink-0 group tracking-[0.16em]"
      >
        <span className="font-sans font-bold text-white text-lg md:text-xl uppercase group-hover:text-lime transition-colors">
          COURT
        </span>
        <span className="font-sans font-bold text-lime text-lg md:text-xl uppercase ml-1.5">HUB</span>
      </Link>

      {/* Internal links — the four core pages */}
      <div className="hidden lg:flex items-center gap-8 xl:gap-10 text-[11px] font-mono uppercase tracking-[0.22em] text-white/80">
        {LINKS.map((l) =>
          l.key === active ? (
            <Link key={l.key} href={l.href} className="text-lime font-bold border-b border-lime/30 pb-0.5">
              {l.label}
            </Link>
          ) : (
            <Link key={l.key} href={l.href} className="hover:text-lime transition-colors">
              {l.label}
            </Link>
          )
        )}
      </div>

      {/* Book a Court pill with sonar shockwave + idle wobble */}
      <div className="relative inline-flex group">
        <motion.span
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-lime rounded-full blur-md -z-10"
        />
        <motion.div
          className="relative z-10"
          animate={{ rotate: [0, 1.2, -1.2, 0.8, -0.8, 0], scale: [1, 1.025, 0.985, 1.025, 1] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
        >
          <Link
            href="/contact"
            className="bg-lime hover:bg-white text-ink font-sans text-[10px] md:text-xs font-bold uppercase tracking-widest px-5 py-2.5 sm:px-6 sm:py-3.5 rounded-full transition-all duration-300 shadow-md shadow-lime/10 flex items-center gap-1.5"
          >
            <span>Book a Court</span>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
