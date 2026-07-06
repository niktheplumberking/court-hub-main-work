import Link from 'next/link';

// Hero ported from the About page design: full-viewport ink section, looping
// background video inside a white 3px rounded frame, centered display
// headline. All motion is CSS-only (ch-hero-in / ch-cue in globals.css) so
// this stays a server component.
const QUICK_LINKS = [
  { label: 'Shop Rackets', href: '/shop' },
  { label: 'Build a Court', href: '/construct-your-court' },
  { label: 'Our Services', href: '#services' },
];

export default function SimpleHero() {
  return (
    <header className="ch-on-dark relative flex h-dvh min-h-[640px] bg-ink p-2.5">
      {/* Background video — the page's single large media asset. */}
      <div className="absolute inset-[-4%] z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/assets/images/hero_padel_night_view_1779713624496.png"
          aria-hidden
          className="h-full w-full object-cover [filter:brightness(.82)_contrast(1.12)_saturate(1.15)]"
        >
          <source src="/fulldoneversion.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,12,0.55)_0%,rgba(14,14,12,0.05)_45%,rgba(14,14,12,0.78)_100%)]" />
      </div>

      {/* White rounded frame */}
      <div className="relative z-[2] flex flex-1 flex-col justify-end overflow-hidden rounded-[28px] border-2 border-white/60 p-[18px] pb-2 backdrop-blur-[1.5px] shadow-[0_32px_120px_rgba(0,0,0,0.7)] sm:rounded-[44px] sm:border-[3px] sm:p-8 sm:pb-8">
        <h1 className="ch-hero-in pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center font-display font-black uppercase text-white text-[clamp(44px,9.4vw,124px)] leading-[0.85] tracking-[-0.04em] [text-shadow:0_10px_24px_rgba(0,0,0,0.6)]">
          Experience Padel
          <br />
          Elevated
        </h1>

        {/* Bottom strip */}
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-white/15 pt-5">
          <div>
            <p className="max-w-[380px] text-[13.5px] font-medium leading-relaxed text-white/80">
              Premium padel courts engineered for the GCC, plus a curated shop of
              elite rackets and gear — all in one place.
            </p>
            <div className="mt-3.5 hidden flex-wrap gap-2 sm:flex">
              {QUICK_LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="rounded-full border border-white/30 px-3.5 py-[7px] font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 backdrop-blur-sm transition-colors duration-200 hover:border-lime hover:bg-lime hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <Link
              href="/construct-your-court"
              className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-lime px-7 py-[15px] font-display text-sm font-bold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink hover:text-lime sm:flex-none"
            >
              Construct Your Court
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-[15px] w-[15px]" aria-hidden>
                <path d="M7 17L17 7M17 7H8M17 7v9" />
              </svg>
            </Link>
            <Link
              href="/shop"
              className="inline-flex flex-1 items-center justify-center rounded-full border-[1.5px] border-white/40 px-7 py-[15px] font-display text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white sm:flex-none"
            >
              Shop Now
            </Link>
          </div>
        </div>

        {/* Scroll cue — hidden on mobile; removed entirely under reduced motion (.ch-cue). */}
        <div
          aria-hidden
          className="ch-cue absolute bottom-3.5 left-1/2 z-[5] hidden h-[42px] w-[26px] -translate-x-1/2 justify-center rounded-full border-[1.5px] border-white/40 pt-2 sm:flex"
        >
          <i className="ch-cue-dot block h-2 w-[3px] rounded-full bg-lime" />
        </div>
      </div>
    </header>
  );
}
