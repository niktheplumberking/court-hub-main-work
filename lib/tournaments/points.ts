import type { Tier, PointsTable } from './data';

// Tier -> placement points. Higher tier = bigger pool, which naturally weights
// the season leaderboard (a P250 title carries far more than a P25). Ported
// verbatim from the approved demo (TIER_POINTS). This is the single source of
// truth for points on offer; the demo admin can override a tier for the session
// (see lib/tournaments/store.tsx).
export const TIER_POINTS: Record<Tier, PointsTable> = {
  P250: { Winner: 500, Finalist: 330, Semifinal: 200, Quarterfinal: 100, Group: 40, Entry: 15 },
  P100: { Winner: 250, Finalist: 165, Semifinal: 100, Quarterfinal: 50, Group: 20, Entry: 10 },
  P50: { Winner: 120, Finalist: 80, Semifinal: 48, Quarterfinal: 24, Group: 12, Entry: 8 },
  P25: { Winner: 60, Finalist: 40, Semifinal: 24, Quarterfinal: 12, Group: 6, Entry: 5 },
};

// Fixed order low -> high, for admin/select rendering.
export const TIER_ORDER: Tier[] = ['P25', 'P50', 'P100', 'P250'];

// Human-readable weighting note shown on the leaderboard (matches the demo).
export const TIER_WEIGHTING_NOTE = 'Weighting · P250 ×1 · P100 ×0.5 · P50 ×0.24 · P25 ×0.12';

// Points rows for the editors/tables: table key -> display label.
export const POINTS_ROWS: { key: keyof PointsTable; label: string }[] = [
  { key: 'Winner', label: 'Winner' },
  { key: 'Finalist', label: 'Finalist' },
  { key: 'Semifinal', label: 'Semifinalist' },
  { key: 'Quarterfinal', label: 'Quarterfinalist' },
  { key: 'Group', label: 'Group stage' },
  { key: 'Entry', label: 'Participation' },
];
