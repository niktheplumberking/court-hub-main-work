'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, Menu, X, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { PAGE_ORDER } from '@/components/swipe/pageOrder';

const MotionLink = motion.create(Link);

// Canonical nav order per the site spec. The sideways rail drops Home (the
// C/H logo badge is the way home); the mobile menu keeps the full list.
const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Construct Your Court', href: '/construct-your-court' },
  { label: 'Shop', href: '/shop' },
  { label: 'Contact Us', href: '/contact' },
];
const RAIL_LINKS = NAV_LINKS.filter((l) => l.href !== '/');

// Vertical-writing-mode adaptation of the same reveal for the sidebar links.
const UNDERLINE_REVEAL_VERTICAL =
  'after:absolute after:-right-2 after:top-0 after:h-full after:w-[2px] after:rounded-full after:bg-lime/50 after:origin-top after:scale-y-0 after:transition-transform after:duration-[350ms] after:ease-[cubic-bezier(0.65,0,0.35,1)] hover:after:origin-bottom hover:after:scale-y-100';

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  // Swipe pages (and product detail) get the left-vertical rail HARDCODED — same
  // navbar as home's post-scroll state, but always-on. Home keeps its scroll
  // transition; other utility pages keep the horizontal bar.
  const isSwipePage =
    (PAGE_ORDER as readonly string[]).includes(pathname) || pathname.startsWith('/shop');
  // Shop listing has NO hero — it gets the always-visible fixed top navbar
  // (HeroFrameNav fixedBar, rendered by ShopClient) instead of the left rail.
  const isShopListing = pathname === '/shop';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);
  const [scrolled, setScrolled] = useState(false); // glass bg on subpages
  const [activeSection, setActiveSection] = useState('');
  const progressRef = useRef<HTMLDivElement>(null);
  const { count, openDrawer } = useCart();
  // Product detail (/shop/<slug>) shows the rail ALWAYS — it has no glass-frame hero
  // to host an in-frame navbar. The 4 swipe hero pages + home reveal the rail on scroll;
  // over their hero the global top bar is suppressed (home shows it; swipe pages show
  // their own in-frame HeroFrameNav instead).
  const isProductPage = pathname.startsWith('/shop/');
  const railActive = isProductPage || (hasScrolledPastHero && !isShopListing);

  // Scroll lock when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // 1. Scroll check for layout switch (Hero -> Sidebar)
  useEffect(() => {
    const handleScroll = () => {
      // Every hero (home included, now that home uses the same framed hero) is
      // exactly one viewport tall — spawn the rail only once the hero is 100%
      // out of view (full innerHeight), not a hair early.
      const heroThreshold = window.innerHeight;
      setHasScrolledPastHero((isHome || isSwipePage) && window.scrollY >= heroThreshold);
      setScrolled(window.scrollY > 24);
      // top scroll-progress rail (transform-only, cheap)
      if (progressRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        progressRef.current.style.transform = `scaleX(${p})`;
        progressRef.current.style.opacity = p > 0.01 ? '1' : '0';
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome, isSwipePage]);

  // 2. Scroll Spy for active section highlighting
  useEffect(() => {
    const handleScrollSpy = () => {
      const heroThreshold = window.innerHeight * 3 - 100;
      if (window.scrollY < heroThreshold) {
        setActiveSection('');
        return;
      }

      const sections = ['about', 'shop', 'story', 'construction', 'faq', 'footer'];
      const scrollPos = window.scrollY + window.innerHeight * 0.35; // 35% viewport trigger offset

      let matchedSection = '';
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            matchedSection = section;
            break;
          }
        }
      }
      setActiveSection(matchedSection);
    };
    window.addEventListener('scroll', handleScrollSpy);
    handleScrollSpy();
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, []);

  return (
    <>
      {/* Site-wide scroll progress rail */}
      <div className="fixed top-0 left-0 right-0 z-[70] h-[2px] pointer-events-none">
        <div ref={progressRef} className="h-full w-full origin-left scale-x-0 bg-lime shadow-[0_0_10px_rgba(200,255,61,0.55)] transition-opacity duration-300 opacity-0" />
      </div>

      {/* 1. DESKTOP SIDEWAYS RAIL (slides in once the hero is out of view).
          Over a hero, nav is the in-frame HeroFrameNav — no global bar here. */}
      <div className="hidden md:block">
        <AnimatePresence mode="wait">
          {railActive ? (
            <motion.aside
              key="desktop-vertical"
              // Same smooth slide-in on every page (home's exact effect): glide in
              // from the left edge once the hero is fully out, never an abrupt pop.
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 bottom-0 w-24 bg-[#0E0E0C] border-r border-white/10 flex flex-col justify-between py-12 items-center z-50 shadow-[5px_0_30px_rgba(0,0,0,0.5)]"
            >
              {/* Vertical Logo Badge */}
              <Link href="/" className="font-sans text-lg tracking-wider text-white flex flex-col items-center select-none hover:text-lime transition-colors">
                <span className="font-bold">C</span>
                <span className="font-bold text-lime">H</span>
              </Link>

              {/* Vertical Links (Rotated via CSS writing-mode). Tighter gap/size
                  than before — "Construct Your Court" must fit 768px-tall screens. */}
              <div className="flex flex-col gap-6 items-center">
                {RAIL_LINKS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`text-[12px] font-bold tracking-[0.14em] uppercase transition-all duration-300 [writing-mode:vertical-lr] rotate-180 relative py-1 ${
                        isActive
                          ? 'text-lime font-black scale-105'
                          : `text-white/60 hover:text-white ${UNDERLINE_REVEAL_VERTICAL}`
                      }`}
                    >
                      {item.label}
                      {isActive && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.4 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-lime shadow-[0_0_8px_#C8FF3D]"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Bottom Actions — cart deliberately absent: the floating bag
                  widget (bottom-right) is the single cart entry point. */}
              <div className="flex flex-col gap-8 items-center">
                {/* Compact CTA — court construction */}
                <MotionLink
                  href="/construct-your-court"
                  whileHover={{ scale: 1.05, backgroundColor: "#ffffff", color: "#0e0e0c" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-lime text-ink rounded-full flex items-center justify-center shadow-lg transition-colors duration-300"
                  title="Build Your Court"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </MotionLink>
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>

      {/* 2. MOBILE HEADER (Always top horizontal) */}
      <div className="md:hidden relative z-[9999]">
        <header
          className={`fixed top-0 left-0 right-0 z-50 px-6 py-5 transition-all duration-300 ${
            (hasScrolledPastHero || (!isHome && scrolled)) 
              ? 'bg-black/90 backdrop-blur-md border-b border-white/10 shadow-lg' 
              : 'bg-transparent'
          }`}
        >
          <nav className="relative z-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white p-2 hover:text-lime transition-colors cursor-pointer shrink-0"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Logo — green/white combo, beside the hamburger. */}
              <Link href="/" className="font-sans text-[20px] tracking-wide flex items-center select-none">
                <span className="font-bold uppercase tracking-wide text-white">COURT</span>
                <span className="font-bold uppercase ml-1 tracking-wide text-lime">HUB</span>
              </Link>
            </div>

            {/* Book a Court — restored, right-aligned (took the old cart slot; cart now lives
                only in the always-on bottom-right bag widget). */}
            <Link
              href="/contact"
              className="shrink-0 bg-lime hover:bg-white text-ink font-sans text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all shadow-md shadow-lime/10"
            >
              Book a Court
            </Link>
          </nav>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="fixed inset-0 z-40 bg-black pt-28 pb-10 px-8 overflow-y-auto flex flex-col justify-between"
            >
              <div className="flex flex-col gap-6">
                {NAV_LINKS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`text-2xl font-display font-medium transition-colors ${
                        isActive ? 'text-lime font-bold' : 'text-white/80 hover:text-lime'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                {/* Cart Icon inside Mobile Menu — opens the global live drawer */}
                <div className="mt-4 pt-6 border-t border-white/10 flex flex-col gap-4">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      openDrawer();
                    }}
                    className="text-white/80 hover:text-lime flex items-center gap-2 cursor-pointer"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    <span className="text-white text-base font-semibold">
                      Your Cart{count > 0 ? ` (${count} ${count === 1 ? 'item' : 'items'})` : ''}
                    </span>
                  </button>

                  {/* Construction CTA inside Mobile Menu */}
                  <div className="mt-4">
                    <MotionLink
                      href="/construct-your-court"
                      onClick={() => setIsMenuOpen(false)}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-4 bg-lime text-ink rounded-full font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white transition-all duration-300"
                    >
                      <span>Build Your Court</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </MotionLink>
                  </div>
                </div>
              </div>

              {/* Bottom Logo inside Hamburger Menu */}
              <div className="mt-12 pt-8 flex flex-col items-center justify-center select-none border-t border-white/5">
                <div className="font-sans text-[22px] tracking-wide flex items-center">
                  <span className="font-bold uppercase tracking-wide text-white">COURT</span>
                  <span className="font-bold uppercase ml-2 tracking-wide text-lime">HUB</span>
                </div>
                <span className="mt-2 text-[9px] font-mono tracking-[0.25em] text-white/20 uppercase">
                  Premium Padel Experience
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
