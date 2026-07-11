'use client';
import { useEffect, useRef, useState } from 'react';
import type { ContentMap } from '@/lib/content/get';

// Figures cross-checked against the About page copy: 180+ arenas + 2.1x
// dampening (AnimatedCounter stats row), 10yr rust longevity (Climatic
// Shield pillar). 5,000+ community is from the approved demo/brief.

/**
 * Splits a stat string like "180+", "5,000+", "2.1x" or "10yr" into a
 * numeric count-up target (commas stripped, decimals preserved) and the
 * trailing unit. Returns null when the string doesn't start with a number,
 * in which case the raw string is rendered statically.
 */
function parseStat(raw: string): { to: number; decimals: number; unit: string } | null {
  const m = raw.match(/^(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  // Strip only thousands-style commas — a decimal-comma entry like "2,1x"
  // keeps its comma and renders statically instead of silently becoming 21.
  const numeric = m[1].replace(/,(?=\d{3}(\D|$))/g, '');
  if (numeric.includes(',')) return null;
  const to = Number(numeric);
  if (!Number.isFinite(to)) return null;
  const decimals = numeric.includes('.') ? numeric.split('.')[1].length : 0;
  return { to, decimals, unit: m[2] };
}

const format = (n: number, decimals = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/**
 * Count-up that runs once when scrolled into view (ease-out cubic, ~1.4s).
 * Not the shared AnimatedCounter: that one uses toFixed, which would render
 * 5000 without the thousands separator the design shows ("5,000").
 */
function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(() => format(0, decimals));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(format(to, decimals));
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1400;
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          const ease = 1 - Math.pow(1 - p, 3);
          setDisplay(format(to * ease, decimals));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, decimals]);

  return <span ref={ref}>{display}</span>;
}

export default function NumbersStrip({ content }: { content: ContentMap }) {
  const stats = [1, 2, 3, 4].map((n) => ({
    value: content[`home.numbers.stat${n}.value`],
    label: content[`home.numbers.stat${n}.caption`],
  }));

  return (
    <section id="numbers" className="border-b border-ink/10 py-[72px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-ink/50">
            {content['home.numbers.heading']}
          </p>
          <p className="max-w-[360px] text-[14.5px] leading-relaxed text-ink/55">
            {content['home.numbers.intro']}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-y-7 min-[821px]:grid-cols-4 min-[821px]:gap-y-0">
          {stats.map((s, i) => {
            const parsed = parseStat(s.value);
            return (
              <div
                key={s.label}
                className={`border-l border-ink/[.12] px-8 first:border-l-0 first:pl-0 ${
                  // 2-col mobile grid: the 3rd item starts a new row — drop its divider.
                  i === 2 ? 'max-[820px]:border-l-0 max-[820px]:pl-0' : ''
                }`}
              >
                <p className="font-display text-[clamp(38px,4.6vw,60px)] font-black leading-none tracking-[-0.04em] text-ink">
                  {parsed ? (
                    <>
                      <CountUp to={parsed.to} decimals={parsed.decimals} />
                      <span className="text-court-blue">{parsed.unit}</span>
                    </>
                  ) : (
                    s.value
                  )}
                </p>
                <p className="mt-2.5 font-mono text-[10px] font-bold uppercase leading-normal tracking-[0.2em] text-ink/50">
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
