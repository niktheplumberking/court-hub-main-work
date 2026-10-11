'use client';
import { useRouter } from 'next/navigation';
import { useLocalePath, useT } from '@/lib/i18n/LocaleProvider';

/**
 * Top-down padel court (client's own concept, from his artifact): the three
 * halves of the business are the three playing zones — tournaments across the
 * far half, courts and shop in the two near service boxes. Each zone is a
 * real link (hover lights it, click navigates). A ball rallies between the
 * zones on a loop (SVG animateMotion, so it runs regardless of the OS
 * reduce-motion setting, like the other brand loops).
 *
 * Geometry: 20 × 10 m court drawn at 20 px/m, net across the middle, service
 * lines 6.95 m from the net (≈139 px), centre service line between them.
 */
export default function CourtMap() {
  const t = useT().courtMap;
  const lp = useLocalePath();
  const router = useRouter();

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(lp(href));
  };
  const key = (href: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(lp(href));
    }
  };

  // Ball rally path (court coordinates): bottom-left → far half → bottom-right → far half.
  const rally = 'M70 330 L150 92 L172 318 L82 120 L70 330';

  return (
    <div className="ch-court relative w-full max-w-[300px] sm:max-w-[330px] lg:max-w-[360px] mx-auto">
      <svg viewBox="0 0 240 440" className="w-full h-auto overflow-visible" role="img" aria-label={t.title}>
        <defs>
          <linearGradient id="ch-turf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A4FC0" />
            <stop offset="100%" stopColor="#123E9E" />
          </linearGradient>
          <pattern id="ch-mow" width="200" height="40" patternUnits="userSpaceOnUse">
            <rect width="200" height="20" fill="rgba(255,255,255,0.035)" />
          </pattern>
          <filter id="ch-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Glass-wall halo + turf */}
        <rect x="14" y="14" width="212" height="412" rx="6" fill="none" stroke="rgba(142,197,255,0.55)" strokeWidth="6" filter="url(#ch-glow)" />
        <rect x="20" y="20" width="200" height="400" fill="url(#ch-turf)" />
        <rect x="20" y="20" width="200" height="400" fill="url(#ch-mow)" />

        {/* Zones (links) */}
        <a href={lp('/tournaments')} onClick={go('/tournaments')} onKeyDown={key('/tournaments')} className="ch-zone" aria-label={`${t.tour}: ${t.tourSub}`}>
          <rect x="20" y="20" width="200" height="200" />
          <text className="ch-zone-l" x="120" y="128">{t.tour}</text>
          <text className="ch-zone-s" x="120" y="146">{t.tourSub}</text>
        </a>
        <a href={lp('/construct-your-court')} onClick={go('/construct-your-court')} onKeyDown={key('/construct-your-court')} className="ch-zone" aria-label={`${t.courts}: ${t.courtsSub}`}>
          <rect x="20" y="220" width="100" height="139" />
          <text className="ch-zone-l" x="70" y="286">{t.courts}</text>
          <text className="ch-zone-s" x="70" y="303">{t.courtsSub}</text>
        </a>
        <a href={lp('/shop')} onClick={go('/shop')} onKeyDown={key('/shop')} className="ch-zone" aria-label={`${t.shop}: ${t.shopSub}`}>
          <rect x="120" y="220" width="100" height="139" />
          <text className="ch-zone-l" x="170" y="286">{t.shop}</text>
          <text className="ch-zone-s" x="170" y="303">{t.shopSub}</text>
        </a>

        {/* Lines (on top of zones, never intercept clicks) */}
        <g pointerEvents="none" stroke="#FFFFFF" strokeWidth="2.4" fill="none">
          <rect x="20" y="20" width="200" height="400" strokeWidth="3" />
          <line x1="20" y1="81" x2="220" y2="81" />
          <line x1="20" y1="359" x2="220" y2="359" />
          <line x1="120" y1="81" x2="120" y2="359" />
        </g>

        {/* Net in ball colour, with posts */}
        <g pointerEvents="none">
          <line x1="12" y1="220" x2="228" y2="220" stroke="#D8F03C" strokeWidth="4" />
          <line x1="12" y1="220" x2="228" y2="220" stroke="#D8F03C" strokeWidth="10" opacity="0.18" />
          <circle cx="12" cy="220" r="4.5" fill="#D8F03C" />
          <circle cx="228" cy="220" r="4.5" fill="#D8F03C" />
        </g>

        {/* Rally: shadow + ball travel the same path */}
        <g pointerEvents="none">
          <ellipse rx="6" ry="3" fill="rgba(6,26,68,0.45)">
            <animateMotion dur="6.4s" repeatCount="indefinite" path={rally} calcMode="linear" />
          </ellipse>
          <g>
            <animateMotion dur="6.4s" repeatCount="indefinite" path={rally} calcMode="linear" />
            <g className="ch-court-ball">
              <circle r="6" cy="-7" fill="#D8F03C" />
              <path d="M-4 -11 C-1 -8, -1 -6, -4 -3" stroke="#fff" strokeWidth="1.2" fill="none" />
              <path d="M4 -11 C1 -8, 1 -6, 4 -3" stroke="#fff" strokeWidth="1.2" fill="none" />
            </g>
          </g>
        </g>
      </svg>
      <div className="mt-2 flex justify-between px-[8%] font-mono text-[10px] tracking-[0.18em] text-white/70" aria-hidden>
        <span>{t.width}</span>
        <span>{t.size}</span>
      </div>
    </div>
  );
}
