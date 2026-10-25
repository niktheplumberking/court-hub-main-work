'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocalePath } from '@/lib/i18n/LocaleProvider';
import type { HeroRacket } from '@/lib/shop/hero-rackets';

/**
 * Hero showcase: 3D models of the shop's best-selling rackets (client request,
 * inspired by the rotating brain on mindxbridge.com). One racket is shown at a
 * time, slowly auto-rotating and draggable; every 6 s the next one fades in.
 *
 * Models: /public/models/*.glb, generated from the shop's own product photos
 * (Higgsfield / Meshy image-to-3D) and compressed (1024px WebP textures,
 * quantized mesh) so the hero stays fast. To change the line-up, edit
 * Active products select their 3D assets through lib/shop/hero-rackets.ts.
 */
const CYCLE_MS = 6000;

export default function HeroRackets({ viewLabel, rackets }: { viewLabel: string; rackets: HeroRacket[] }) {
  if (!rackets.length) return null;
  return <RacketShowcase key={rackets.map((r) => r.href).join('|')} viewLabel={viewLabel} rackets={rackets} />;
}

function RacketShowcase({ viewLabel, rackets }: { viewLabel: string; rackets: HeroRacket[] }) {
  const lp = useLocalePath();
  const [ready, setReady] = useState(false);
  const [idx, setIdx] = useState(0);
  // First racket gets the bandwidth; the other two models start loading a
  // moment later (≈1.5 MB each), so phones see a racket sooner.
  const [mounted, setMounted] = useState(1);
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(rackets.length), 2500);
    return () => window.clearTimeout(t);
  }, [rackets.length]);
  const holding = useRef(false); // pause the cycle while someone drags a racket

  // model-viewer is a browser-only web component: load it after hydration.
  useEffect(() => {
    let alive = true;
    import('@google/model-viewer').then(() => alive && setReady(true)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // One timer per racket shown: picking a racket (dots) restarts its full 6 s.
  // While someone is dragging it, wait and try again shortly.
  useEffect(() => {
    let t = 0;
    const next = () => {
      if (holding.current) t = window.setTimeout(next, 1500);
      else setIdx((i) => (i + 1) % rackets.length);
    };
    t = window.setTimeout(next, CYCLE_MS);
    return () => window.clearTimeout(t);
  }, [idx, rackets.length]);

  const current = rackets[idx];

  return (
    <div className="ch-rackets flex flex-col items-center">
      <div
        className="ch-rackets-stage relative"
        onPointerDown={() => (holding.current = true)}
        onPointerUp={() => (holding.current = false)}
        onPointerLeave={() => (holding.current = false)}
      >
        {/* Spotlight + court-line rings behind the racket */}
        <div aria-hidden className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(142,197,255,0.55)_0%,rgba(59,130,246,0.25)_38%,transparent_68%)]" />
        <div aria-hidden className="ch-rackets-ring absolute inset-[10%] rounded-full border border-white/25" />
        <div aria-hidden className="ch-rackets-ring ch-rackets-ring--2 absolute inset-[22%] rounded-full border border-dashed border-white/20" />
        <div aria-hidden className="absolute bottom-[7%] left-1/2 -translate-x-1/2 w-[46%] h-[7%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(6,26,68,0.55),transparent_70%)] blur-[2px]" />

        {rackets.map((r, i) => {
          const active = i === idx;
          return (
            <div key={r.src} className={`ch-racket absolute inset-0 ${active ? 'is-active' : ''}`} aria-hidden={!active}>
              {ready && (i < mounted || active) ? (
                <model-viewer
                  src={r.src}
                  alt={`${r.brand} ${r.name}, 3D view`}
                  camera-controls=""
                  disable-zoom=""
                  disable-pan=""
                  disable-tap=""
                  auto-rotate=""
                  auto-rotate-delay="0"
                  rotation-per-second="42deg"
                  interaction-prompt="none"
                  min-camera-orbit="auto 82deg auto"
                  max-camera-orbit="auto 82deg auto"
                  camera-orbit="0deg 82deg auto"
                  field-of-view="26deg"
                  exposure="1.15"
                  shadow-intensity="0"
                  environment-image="neutral"
                  loading="eager"
                  style={{ width: '100%', height: '100%', background: 'transparent', ['--poster-color' as string]: 'transparent' }}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Caption: which racket, link, and manual dots */}
      <div className="mt-1 flex flex-col items-center text-center">
        <p key={`b${idx}`} className="ch-racket-cap font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">
          {current.brand}
        </p>
        <p key={`n${idx}`} className="ch-racket-cap font-display text-lg sm:text-xl font-black uppercase tracking-tight text-white">
          {current.name}
        </p>
        <Link
          href={lp(current.href)}
          className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#D8F03C] hover:text-white transition-colors"
        >
          {viewLabel} →
        </Link>
        <div className="mt-3 flex items-center gap-2" role="tablist" aria-label="Rackets">
          {rackets.map((r, i) => (
            <button
              key={r.src}
              type="button"
              role="tab"
              aria-selected={i === idx}
              aria-label={r.name}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${i === idx ? 'w-7 bg-[#D8F03C]' : 'w-2 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
