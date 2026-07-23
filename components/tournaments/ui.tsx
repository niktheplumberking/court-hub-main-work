'use client';
// Shared presentational primitives for the Tournaments feature: status pills,
// tier badges, division chips, small line icons, and the money formatter.
// Colors use brand Tailwind tokens (sand / ink / court-blue / lime / green /
// fire). The two non-brand accents the demo uses — the P25 slate grey and the
// P250 gold gradient — are the only literal values here, since neither is a
// brand token.
import type { Tier, TournamentStatus, Division } from '@/lib/tournaments/data';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { Dict } from '@/lib/i18n/dict';

export const money = (n: number): string => n.toLocaleString('en-US');

// ---- Button styles (pill buttons, brand tokens) ----
export const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-full font-display text-[13.5px] font-bold tracking-[0.01em] transition-[transform,background,color] duration-150 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40';
export const btnPad = 'px-[26px] py-[14px]';
export const btnSm = 'px-[18px] py-2.5 text-[12px]';

export type BtnVariant = 'lime' | 'ink' | 'ghost' | 'ghostLight';
export const btnVariant: Record<BtnVariant, string> = {
  lime: 'bg-lime text-ink hover:bg-ink hover:text-lime',
  ink: 'bg-ink text-white hover:bg-court-blue',
  ghost: 'bg-transparent text-ink border-[1.5px] border-ink/20 hover:border-ink',
  ghostLight: 'bg-transparent text-white border-[1.5px] border-white/35 hover:border-white',
};

/** Compose a pill-button className. */
export function btn(variant: BtnVariant = 'lime', extra = '', sm = false): string {
  return `${btnBase} ${sm ? btnSm : btnPad} ${btnVariant[variant]} ${extra}`.trim();
}

const STATUS_META: Record<
  TournamentStatus,
  { label: (d: Dict['tournaments']) => string; className: string; dot?: string }
> = {
  live: { label: (d) => d.statusLive, className: 'bg-fire text-white', dot: 'bg-white ch-blink' },
  open: { label: (d) => d.registrationOpen, className: 'bg-green text-white', dot: 'bg-white' },
  soon: { label: (d) => d.statusUpcoming, className: 'bg-ink text-lime' },
  done: { label: (d) => d.statusCompleted, className: 'bg-sand-2 text-ink/50' },
};

/** Localized display label for a data division value ('Men' | 'Women' | 'Mixed'). */
export function divisionLabel(d: Dict['tournaments'], division: Division): string {
  return division === 'Men' ? d.men : division === 'Women' ? d.women : d.mixed;
}

/** Localized display label for a data format value; unknown values pass through. */
export function formatLabel(d: Dict['tournaments'], format: string): string {
  return format === 'Round Robin' ? d.roundRobin : format === 'Groups + Knockout' ? d.groupsKnockout : format;
}

export function StatusPill({ status }: { status: TournamentStatus }) {
  const t = useT();
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] font-mono text-[9.5px] font-bold uppercase tracking-[0.13em] ${m.className}`}
    >
      {m.dot && <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />}
      {m.label(t.tournaments)}
    </span>
  );
}

const TIER_CLASS: Record<Tier, string> = {
  P25: 'bg-[#7a8a99] text-white',
  P50: 'bg-court-blue text-white',
  P100: 'bg-ink text-white',
  P250: 'bg-[linear-gradient(135deg,#b8933e,#e8c766)] text-ink',
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-block rounded-lg px-2.5 py-[5px] font-display text-[11px] font-black tracking-[0.02em] ${TIER_CLASS[tier]}`}
    >
      {tier}
    </span>
  );
}

/** Division chip. `dark` variant sits on dark headers/cards. */
export function DivChip({
  division,
  label,
  dark = false,
}: {
  division?: Division;
  label?: string;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] ${
        dark ? 'border-white/25 text-white/80' : 'border-ink/10 text-ink/55'
      }`}
    >
      {label ?? division}
    </span>
  );
}

// ---- Line icons (exact paths from the approved demo) ----
type IconProps = { className?: string };

export function CalIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function PinIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function FmtIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 3v18M18 3v18M6 8h12M6 16h12" />
    </svg>
  );
}

export function CheckIcon({ className = 'h-[17px] w-[17px]' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function ArrowRightIcon({ className = 'h-[15px] w-[15px]' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
