import { useId } from 'react';

/**
 * Tennis/padel ball in the client's own ball colour (#D8F03C, from his
 * artifact): felt gradient, two white seams, soft shine. Pure SVG, scales to
 * any size via className.
 */
export default function TennisBall({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={className} style={style} aria-hidden>
      <defs>
        <radialGradient id={`tb-felt-${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#F3FF8A" />
          <stop offset="55%" stopColor="#D8F03C" />
          <stop offset="100%" stopColor="#A9C21A" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill={`url(#tb-felt-${id})`} />
      <path d="M6 9 C14 15, 14 25, 6 31" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.95" />
      <path d="M34 9 C26 15, 26 25, 34 31" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.95" />
      <ellipse cx="14" cy="11" rx="5" ry="3" fill="#FFFFFF" opacity="0.35" transform="rotate(-30 14 11)" />
    </svg>
  );
}
