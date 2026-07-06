import Link from 'next/link';
import Image from 'next/image';
import Reveal from './Reveal';

// Blurb condensed from the About page story copy (Al Quoz foundry origin,
// Spanish glass + alloy engineering) — same source as the approved demo.
export default function AboutTeaser() {
  return (
    <section id="about" className="py-[88px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-1 items-center gap-8 min-[901px]:grid-cols-2 min-[901px]:gap-14">
          <Reveal>
            <div className="relative aspect-[4/3.4] overflow-hidden rounded-[44px]">
              <Image
                src="/assets/images/court_action_landscape_1779705580138.png"
                alt="Padel action on a Court Hub court"
                fill
                sizes="(max-width: 900px) 100vw, 616px"
                className="object-cover"
              />
              <div className="ch-on-dark absolute bottom-4 left-4 flex items-center gap-3.5 rounded-[16px] bg-ink/80 px-[18px] py-3.5 text-white backdrop-blur-md">
                <b className="font-display text-[22px] font-black text-lime">180+</b>
                <span className="font-mono text-[9px] uppercase leading-normal tracking-[0.16em] text-white/65">
                  Arenas built
                  <br />
                  across the GCC
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-ink/50">
              Who we are
            </p>
            <h2 className="font-display text-[clamp(30px,4.4vw,54px)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-ink">
              Crafted for
              <br />
              the Obsessed
            </h2>
            <p className="mb-7 mt-[22px] max-w-[480px] text-[15px] leading-[1.7] text-ink/[.68]">
              Born in Al Quoz, Dubai — we fuse Spanish structural glass with
              aerospace-grade metal alloys to build courts that ignore high
              winds, and curate rackets that protect your game. Architectural
              integrity meets player stamina.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-ink/25 px-7 py-[15px] font-display text-sm font-bold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ink"
            >
              Read Our Full Story
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-[15px] w-[15px]" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
