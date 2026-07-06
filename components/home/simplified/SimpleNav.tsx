'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// Every key destination one click away. "Services" is the on-page section;
// the rest are real routes. The existing Header.tsx is hardwired to the old
// scroll-jacked home (rail swap at 3 viewport heights), so the simplified
// home gets this lightweight sticky nav instead (per the handoff brief).
const LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Shop', href: '/shop' },
  { label: 'Construct Your Court', href: '/construct-your-court' },
  { label: 'About', href: '/about' },
];

export default function SimpleNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll lock while the full-screen menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  // Over the hero the nav is transparent on ink → white text; after ~40px it
  // sits on frosted sand → ink text.
  const linkColor = scrolled ? 'text-ink/70' : 'text-white/85';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-3.5 transition-[background,box-shadow] duration-300 ${
          scrolled
            ? 'bg-sand/[.92] backdrop-blur-md shadow-[0_1px_0_rgba(14,14,12,0.08)]'
            : 'bg-transparent'
        }`}
      >
        <Link
          href="/"
          className={`font-display font-black text-[19px] uppercase tracking-[-0.02em] transition-colors duration-300 ${
            scrolled ? 'text-ink' : 'text-white'
          }`}
        >
          Court Hub
        </Link>

        <div className="hidden min-[821px]:flex items-center gap-7">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`text-[13px] font-semibold transition-colors duration-200 hover:text-court-blue ${linkColor}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/construct-your-court"
            className="bg-lime text-ink font-display font-bold text-[13px] px-5 py-2.5 rounded-full transition-transform duration-200 hover:scale-105"
          >
            Get a Quote
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className={`hidden max-[820px]:flex w-[42px] h-[42px] rounded-xl flex-col items-center justify-center gap-[5px] backdrop-blur-sm transition-colors ${
              scrolled && !menuOpen ? 'bg-ink/10' : 'bg-white/15'
            }`}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`w-[18px] h-[2px] rounded-full transition-all duration-250 ${
                  menuOpen || !scrolled ? 'bg-white' : 'bg-ink'
                } ${
                  menuOpen
                    ? i === 0
                      ? 'translate-y-[7px] rotate-45'
                      : i === 1
                        ? 'opacity-0'
                        : '-translate-y-[7px] -rotate-45'
                    : ''
                }`}
              />
            ))}
          </button>
        </div>
      </nav>

      {/* Full-screen ink overlay menu (mobile) */}
      <div
        className={`ch-on-dark fixed inset-0 z-[90] bg-ink/[.97] backdrop-blur-lg flex flex-col justify-center gap-1.5 p-8 transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!menuOpen}
      >
        <p className="font-mono text-[10px] font-bold tracking-[0.22em] uppercase text-white/40 mb-2.5">
          Court Hub — Menu
        </p>
        {LINKS.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            onClick={closeMenu}
            tabIndex={menuOpen ? 0 : -1}
            className="font-display font-black uppercase tracking-[-0.02em] text-[34px] text-white py-2.5 border-b border-white/10 transition-colors hover:text-lime"
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/construct-your-court"
          onClick={closeMenu}
          tabIndex={menuOpen ? 0 : -1}
          className="mt-6 self-start bg-lime text-ink font-display font-bold text-sm px-7 py-3.5 rounded-full"
        >
          Get a Quote
        </Link>
      </div>
    </>
  );
}
