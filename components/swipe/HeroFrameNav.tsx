'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { useLocale, useLocalePath, useT } from '@/lib/i18n/LocaleProvider';
import { switchLocalePath } from '@/lib/i18n/locale';

/**
 * THE site top navbar (one of the only two nav versions, with the side rail):
 * COURT HUB logo · About Us / Construct Your Court / Shop / Contact Us · Book a Court.
 * Two placements:
 *  • default — lives INSIDE a page's glass-frame hero (home + the swipe pages)
 *    and scrolls away with it; the global side rail takes over past the hero.
 *  • fixedBar — viewport-fixed bar for pages WITHOUT a hero (Shop): same row,
 *    no frame, visible at all times.
 */
type ActiveKey = 'home' | 'about' | 'construct' | 'shop' | 'tournaments' | 'contact';

const LINKS: { key: ActiveKey; href: string }[] = [
  { key: 'home', href: '/' },
  { key: 'about', href: '/about' },
  { key: 'construct', href: '/construct-your-court' },
  { key: 'shop', href: '/shop' },
  { key: 'tournaments', href: '/tournaments' },
  { key: 'contact', href: '/contact' },
];

export default function HeroFrameNav({
  active,
  fixedBar = false,
}: {
  active?: ActiveKey;
  fixedBar?: boolean;
}) {
  const t = useT();
  const lp = useLocalePath();
  const locale = useLocale();
  const pathname = usePathname();
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
        href={lp('/')}
        className="text-start flex items-center select-none font-sans shrink-0 group tracking-[0.16em]"
      >
        <span className="font-sans font-bold text-white text-lg md:text-xl uppercase group-hover:text-lime transition-colors">
          COURT
        </span>
        <span className="font-sans font-bold text-lime text-lg md:text-xl uppercase ms-1.5">HUB</span>
      </Link>

      {/* Internal links — six entries now. At lg (1024) the framed-hero row is
          only ~840px wide, so run smaller/tighter there (plus px-3 so the row
          NEVER touches the logo/CTA even at exact fit) and relax at xl. */}
      <div className="hidden lg:flex items-center gap-4 xl:gap-8 px-3 text-[10px] xl:text-[11px] font-mono uppercase tracking-[0.14em] xl:tracking-[0.16em] text-white/80">
        {LINKS.map((l) =>
          l.key === active ? (
            <Link key={l.key} href={lp(l.href)} className="text-lime font-bold border-b border-lime/30 pb-0.5">
              {t.nav[l.key]}
            </Link>
          ) : (
            <Link key={l.key} href={lp(l.href)} className="hover:text-lime transition-colors">
              {t.nav[l.key]}
            </Link>
          )
        )}
        {/* Language switcher — labeled in its own language. */}
        <Link
          href={switchLocalePath(locale, pathname)}
          className="hover:text-lime transition-colors border-s border-white/15 ps-4"
        >
          {t.nav.langSwitch}
        </Link>
      </div>

      {/* Book a Court pill (static) */}
      <Link
        href={lp('/contact')}
        className="shrink-0 bg-lime hover:bg-white text-ink font-sans text-[10px] md:text-xs font-bold uppercase tracking-widest px-5 py-2.5 sm:px-6 sm:py-3.5 rounded-full transition-colors duration-300 shadow-md shadow-lime/10 flex items-center gap-1.5"
      >
        <span>{t.nav.bookACourt}</span>
      </Link>
    </motion.div>
  );
}
