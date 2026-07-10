// ============================================================================
// Tournaments data layer — types + demo seed (single source of truth).
//
// Everything the Tournaments feature renders reads from here (and from
// points.ts). When Supabase is wired in later this becomes a data-source swap
// only, not a component rewrite: replace the exported consts with fetches that
// return the same shapes. Ported verbatim from the approved demo
// (court-hub-tournaments.html): TIER_POINTS, T_DXB, GROUP_A/B, BRACKET,
// SCHEDULE_DXB, TOURNAMENTS, LEADERBOARD.
// ============================================================================

export type Tier = 'P25' | 'P50' | 'P100' | 'P250';
export type Division = 'Men' | 'Women' | 'Mixed';
export type TournamentStatus = 'live' | 'open' | 'soon' | 'done';
export type MatchStatus = 'done' | 'live' | 'soon';
export type ScheduleState = 'done' | 'live' | 'soon';

export interface PointsTable {
  Winner: number;
  Finalist: number;
  Semifinal: number;
  Quarterfinal: number;
  Group: number;
  Entry: number;
}

/** A registered doubles pair. `name` is "Lastname / Lastname". */
export interface Pair {
  id: string;
  name: string;
  p1: string;
  p2: string;
  nat: string;
}

/** One row of a group table. SF/SA = sets for/against, PTS = group points. */
export interface GroupStanding {
  t: Pair;
  P: number;
  W: number;
  L: number;
  SF: number;
  SA: number;
  PTS: number;
  q: boolean;
}

/** A knockout match. sa/sb are set-score arrays for a / b. */
export interface Match {
  id: string;
  label: string;
  a: Pair | null;
  b: Pair | null;
  sa: number[];
  sb: number[];
  status: MatchStatus;
  court: string;
  time: string;
}

export interface Bracket {
  sf: Match[];
  final: Match;
  third: Match;
}

export interface ScheduleEvent {
  t: string;
  n: string;
  v: string;
  s: ScheduleState;
}

export interface ScheduleDay {
  d: string;
  dow: string;
  evs: ScheduleEvent[];
}

export interface ResultTeam {
  name: string;
  nat: string;
}

export interface TournamentResult {
  champion: ResultTeam;
  runnerUp: ResultTeam;
  third: ResultTeam;
  score: string;
}

export interface Tournament {
  slug: string;
  name: string;
  tier: Tier;
  division: Division;
  status: TournamentStatus;
  dates: string;
  venue: string;
  format: string;
  cap: number;
  reg: number;
  fee: number;
  prize: number;
  cover: string;
  blurb: string;
  hasBracket?: boolean;
  result?: TournamentResult;
}

export interface LeaderboardRow {
  mv: number;
  name: string;
  nat: string;
  div: Division;
  ev: number;
  titles: number;
  pts: number;
}

// ---------------------------------------------------------------------------
// Cover art. The demo shipped base64 blobs (window.__IMG__). Here we map those
// keys to real optimized padel photos already in /public/images, so next/image
// can serve them. Keys mirror the demo (tcrowd / tcourt / tdetail / poster /
// about / construct) so the tournament -> cover assignments stay identical.
// ---------------------------------------------------------------------------
export const COVERS = {
  tcrowd: '/images/tournament_crowd_night_1779707031611.webp',
  tcourt: '/images/court_action_landscape_1779705580138.webp',
  tdetail: '/images/faq_padel_detail_1779708774500.webp',
  poster: '/images/hero_padel_night_view_1779713624496.png',
  about: '/images/hero_court_background_1779705118750.png',
  construct: '/images/dubai_court_night_construction_1779706759259.webp',
} as const;

/** Pool of covers the demo admin randomly assigns to newly created events. */
export const ADMIN_COVER_POOL: string[] = [
  COVERS.tcourt,
  COVERS.about,
  COVERS.poster,
  COVERS.tcrowd,
  COVERS.construct,
];

// Build a pair: display name is "Lastname / Lastname" (matches the demo helper).
const pair = (id: string, p1: string, p2: string, nat: string): Pair => ({
  id,
  name: `${p1.split(' ').pop()} / ${p2.split(' ').pop()}`,
  p1,
  p2,
  nat,
});

// ---- Live tournament: Court Hub Dubai Open (P250 Men), 8 pairs, 2 groups ----
export const T_DXB = {
  A: [
    pair('t1', 'Javier Moreno', 'Alejandro Ruiz', 'ESP'),
    pair('t2', 'Agustín Torres', 'Matías Gómez', 'ARG'),
    pair('t3', 'Faisal Al-Otaibi', 'Saud Al-Ghamdi', 'KSA'),
    pair('t4', 'Omar Al-Falasi', 'Ahmed Al-Shamsi', 'UAE'),
  ],
  B: [
    pair('t5', 'Pablo Herrera', 'Sergio Navarro', 'ESP'),
    pair('t6', 'Lucas Ferrari', 'Nicolás Rossi', 'ARG'),
    pair('t7', 'Diego Fernández', 'Marc Vidal', 'ESP'),
    pair('t8', 'Khalid Al-Mansoori', 'Nasser Al-Dosari', 'UAE'),
  ],
};

export const GROUP_A: GroupStanding[] = [
  { t: T_DXB.A[0], P: 3, W: 3, L: 0, SF: 6, SA: 1, PTS: 9, q: true },
  { t: T_DXB.A[1], P: 3, W: 2, L: 1, SF: 5, SA: 3, PTS: 6, q: true },
  { t: T_DXB.A[2], P: 3, W: 1, L: 2, SF: 3, SA: 5, PTS: 3, q: false },
  { t: T_DXB.A[3], P: 3, W: 0, L: 3, SF: 1, SA: 6, PTS: 0, q: false },
];

export const GROUP_B: GroupStanding[] = [
  { t: T_DXB.B[0], P: 3, W: 3, L: 0, SF: 6, SA: 2, PTS: 9, q: true },
  { t: T_DXB.B[1], P: 3, W: 2, L: 1, SF: 5, SA: 3, PTS: 6, q: true },
  { t: T_DXB.B[2], P: 3, W: 1, L: 2, SF: 3, SA: 4, PTS: 3, q: false },
  { t: T_DXB.B[3], P: 3, W: 0, L: 3, SF: 1, SA: 6, PTS: 0, q: false },
];

// Knockout: 2 semifinals done, final live in progress, 3rd-place done.
export const BRACKET: Bracket = {
  sf: [
    { id: 'sf1', label: 'Semifinal 1', a: T_DXB.A[0], b: T_DXB.B[1], sa: [6, 6], sb: [3, 4], status: 'done', court: 'Centre Court', time: 'Sat 14:00' },
    { id: 'sf2', label: 'Semifinal 2', a: T_DXB.B[0], b: T_DXB.A[1], sa: [7, 6], sb: [5, 4], status: 'done', court: 'Centre Court', time: 'Sat 15:30' },
  ],
  final: { id: 'final', label: 'Final', a: T_DXB.A[0], b: T_DXB.B[0], sa: [6, 3], sb: [4, 3], status: 'live', court: 'Centre Court', time: 'Sat 18:00' },
  third: { id: 'third', label: '3rd Place', a: T_DXB.B[1], b: T_DXB.A[1], sa: [6, 6], sb: [2, 3], status: 'done', court: 'Court 2', time: 'Sat 16:30' },
};

export const SCHEDULE_DXB: ScheduleDay[] = [
  { d: '11', dow: 'Thu', evs: [
    { t: '13:00', n: 'Group Stage · Round 1', v: 'Courts 1-4', s: 'done' },
    { t: '17:00', n: 'Group Stage · Round 2', v: 'Courts 1-4', s: 'done' },
  ] },
  { d: '12', dow: 'Fri', evs: [
    { t: '13:00', n: 'Group Stage · Round 3', v: 'Courts 1-4', s: 'done' },
    { t: '16:00', n: 'Standings Confirmed', v: '–', s: 'done' },
  ] },
  { d: '13', dow: 'Sat', evs: [
    { t: '14:00', n: 'Semifinal 1', v: 'Centre Court', s: 'done' },
    { t: '15:30', n: 'Semifinal 2', v: 'Centre Court', s: 'done' },
    { t: '16:30', n: '3rd Place Match', v: 'Court 2', s: 'done' },
    { t: '18:00', n: 'FINAL', v: 'Centre Court', s: 'live' },
  ] },
];

// ---- Tournaments (the hub dataset) ----
export const TOURNAMENTS: Tournament[] = [
  {
    slug: 'dubai-open', name: 'Court Hub Dubai Open', tier: 'P250', division: 'Men', status: 'live',
    dates: '11–13 Jul 2026', venue: 'Court Hub Arena, Al Quoz', format: 'Groups + Knockout',
    cap: 8, reg: 8, fee: 600, prize: 40000, cover: COVERS.tcrowd,
    blurb: "The flagship P250 on the Court Hub calendar. Eight of the region's strongest pairs, two groups, and a single-elimination finish under the lights at our Al Quoz arena.",
    hasBracket: true,
  },
  {
    slug: 'desert-smash', name: 'Desert Smash Mixed', tier: 'P100', division: 'Mixed', status: 'open',
    dates: '25–26 Jul 2026', venue: 'Dubai Sports City', format: 'Groups + Knockout',
    cap: 16, reg: 11, fee: 350, prize: 15000, cover: COVERS.tcourt,
    blurb: 'A fast, friendly mixed-doubles P100 across a single weekend. Balanced groups, then a knockout to the final. Perfect first competitive step for club pairs.',
  },
  {
    slug: 'jumeirah-ladies', name: 'Jumeirah Ladies Cup', tier: 'P100', division: 'Women', status: 'open',
    dates: '1–2 Aug 2026', venue: 'Jumeirah Padel Club', format: 'Groups + Knockout',
    cap: 12, reg: 7, fee: 350, prize: 15000, cover: COVERS.tdetail,
    blurb: 'A women-only P100 hosted at Jumeirah Padel Club. Round-robin groups guarantee every pair multiple matches before the knockout rounds.',
  },
  {
    slug: 'marina-p50', name: 'Marina Twilight P50', tier: 'P50', division: 'Mixed', status: 'soon',
    dates: '8–9 Aug 2026', venue: 'Dubai Marina Courts', format: 'Round Robin',
    cap: 10, reg: 0, fee: 180, prize: 6000, cover: COVERS.poster,
    blurb: 'An evening social-competitive P50 on the Marina courts. Full round-robin so you play everyone. Registration opens soon.',
  },
  {
    slug: 'proam-p25', name: 'Court Hub Pro-Am P25', tier: 'P25', division: 'Mixed', status: 'open',
    dates: '15 Aug 2026', venue: 'Court Hub Arena, Al Quoz', format: 'Groups + Knockout',
    cap: 16, reg: 9, fee: 120, prize: 3000, cover: COVERS.about,
    blurb: 'The entry point to competition. A one-day P25 designed for players stepping into their first tournament. Friendly, fast, and welcoming.',
  },
  {
    slug: 'alquoz-winter', name: 'Al Quoz Winter Championship', tier: 'P250', division: 'Men', status: 'done',
    dates: '20–22 Jun 2026', venue: 'Court Hub Arena, Al Quoz', format: 'Groups + Knockout',
    cap: 8, reg: 8, fee: 600, prize: 40000, cover: COVERS.construct,
    blurb: 'The winter flagship. Won by Moreno / Ruiz over Herrera / Navarro in three sets. Points from this event feed the current season leaderboard.',
    result: { champion: { name: 'Moreno / Ruiz', nat: 'ESP' }, runnerUp: { name: 'Herrera / Navarro', nat: 'ESP' }, third: { name: 'Torres / Gómez', nat: 'ARG' }, score: '6-4, 4-6, 6-3' },
  },
  {
    slug: 'abudhabi-p100', name: 'Abu Dhabi Open P100', tier: 'P100', division: 'Men', status: 'done',
    dates: '6–7 Jun 2026', venue: 'Zayed Sports City', format: 'Groups + Knockout',
    cap: 16, reg: 16, fee: 350, prize: 15000, cover: COVERS.tcourt,
    blurb: 'A completed regional P100. Results contribute to season standings across the men\'s division.',
    result: { champion: { name: 'Al-Otaibi / Al-Ghamdi', nat: 'KSA' }, runnerUp: { name: 'Ferrari / Rossi', nat: 'ARG' }, third: { name: 'Fernández / Vidal', nat: 'ESP' }, score: '6-3, 7-6(5)' },
  },
];

// ---- Season leaderboard (cumulative, derived-style) ----
// Note the realistic touch: some pairs appear in both a gender division and
// Mixed. All four filters (All/Men/Women/Mixed) return real data.
export const LEADERBOARD: LeaderboardRow[] = [
  { mv: 0, name: 'Moreno / Ruiz', nat: 'ESP', div: 'Men', ev: 4, titles: 2, pts: 1310 },
  { mv: 1, name: 'Herrera / Navarro', nat: 'ESP', div: 'Men', ev: 4, titles: 1, pts: 1085 },
  { mv: -1, name: 'Torres / Gómez', nat: 'ARG', div: 'Men', ev: 4, titles: 0, pts: 760 },
  { mv: 2, name: 'Ferrari / Rossi', nat: 'ARG', div: 'Men', ev: 3, titles: 0, pts: 615 },
  { mv: 0, name: 'Al-Otaibi / Al-Ghamdi', nat: 'KSA', div: 'Men', ev: 4, titles: 1, pts: 540 },
  { mv: -2, name: 'Fernández / Vidal', nat: 'ESP', div: 'Men', ev: 3, titles: 0, pts: 430 },
  { mv: 3, name: 'Al-Mansoori / Al-Dosari', nat: 'UAE', div: 'Men', ev: 4, titles: 0, pts: 365 },
  { mv: 0, name: 'Al-Falasi / Al-Shamsi', nat: 'UAE', div: 'Men', ev: 3, titles: 0, pts: 290 },
  { mv: 0, name: 'Costa / Ríos', nat: 'ESP', div: 'Women', ev: 2, titles: 1, pts: 250 },
  { mv: 1, name: 'Al-Amoudi / Al-Sabah', nat: 'KSA', div: 'Women', ev: 2, titles: 0, pts: 180 },
  { mv: -1, name: 'Delgado / Sánchez', nat: 'ESP', div: 'Women', ev: 2, titles: 0, pts: 140 },
  { mv: 2, name: 'Navarro / Delgado', nat: 'ESP', div: 'Mixed', ev: 2, titles: 1, pts: 210 },
  { mv: 0, name: 'Al-Shamsi / Al-Mheiri', nat: 'UAE', div: 'Mixed', ev: 2, titles: 0, pts: 150 },
  { mv: -1, name: 'Gómez / Ríos', nat: 'ARG', div: 'Mixed', ev: 1, titles: 0, pts: 95 },
];

// Sort helper: live -> open -> soon -> done (used by the hub grid).
export const STATUS_ORDER: Record<TournamentStatus, number> = { live: 0, open: 1, soon: 2, done: 3 };

/** The group tables for the live Dubai Open, keyed A/B. */
export const DXB_GROUPS: Record<'A' | 'B', GroupStanding[]> = { A: GROUP_A, B: GROUP_B };

/** Look up a seed tournament by slug (server-safe; ignores session extras). */
export function getSeedTournament(slug: string): Tournament | undefined {
  return TOURNAMENTS.find((t) => t.slug === slug);
}
