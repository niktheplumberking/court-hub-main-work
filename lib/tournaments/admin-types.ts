// Shared shapes for the tournaments backend. Pure types plus tiny constants,
// safe to import from server and client code alike. The runtime data lives in
// lib/tournaments/server-store.ts (server only); when Supabase lands at the
// final stage these become the row shapes of the new tables.
import type {
  Bracket,
  GroupStanding,
  Pair,
  ScheduleDay,
  Tournament,
  PointsTable,
} from './data';

export type MatchSlot = 'sf1' | 'sf2' | 'final' | 'third';
export const MATCH_SLOTS: { slot: MatchSlot; label: string }[] = [
  { slot: 'sf1', label: 'Semifinal 1' },
  { slot: 'sf2', label: 'Semifinal 2' },
  { slot: 'final', label: 'Final' },
  { slot: 'third', label: '3rd Place' },
];

export type RegistrationStatus = 'demo' | 'pending' | 'paid' | 'cancelled';
export const REGISTRATION_STATUSES: RegistrationStatus[] = ['demo', 'pending', 'paid', 'cancelled'];

/** A booked pair. Counts toward capacity while status is demo or paid. */
export interface Registration {
  id: string;
  slug: string;
  captain: string;
  email: string;
  phone: string;
  nat: string;
  level: string;
  partner: string;
  pcontact: string;
  ref: string;
  method: string;
  status: RegistrationStatus;
  amount: number;
  stripeSessionId?: string;
  createdAt: string;
}

/** One editable row of a group standings table. */
export interface GroupTeamRow {
  id: string;
  pairName: string;
  p1: string;
  p2: string;
  nat: string;
  P: number;
  W: number;
  L: number;
  SF: number;
  SA: number;
  PTS: number;
  q: boolean;
  sort: number;
}

export interface GroupData {
  id: string;
  label: string;
  sort: number;
  teams: GroupTeamRow[];
}

/** One knockout slot (sf1/sf2/final/third) as stored/edited in the admin. */
export interface MatchData {
  slot: MatchSlot;
  label: string;
  aName: string;
  aNat: string;
  bName: string;
  bNat: string;
  sa: number[];
  sb: number[];
  status: 'done' | 'live' | 'soon';
  court: string;
  time: string;
}

export interface ScheduleRowData {
  id: string;
  day: string;
  dow: string;
  time: string;
  title: string;
  venue: string;
  state: 'done' | 'live' | 'soon';
  sort: number;
}

export interface LeaderboardEntry {
  id: string;
  mv: number;
  name: string;
  nat: string;
  div: 'Men' | 'Women' | 'Mixed';
  ev: number;
  titles: number;
  pts: number;
  sort: number;
}

/** Everything a public tournament detail page needs, fetched server-side. */
export interface TournamentDetailData {
  tournament: Tournament;
  points: PointsTable;
  groups: { label: string; rows: GroupStanding[] }[];
  bracket: Bracket | null;
  schedule: ScheduleDay[];
  teams: Pair[];
}

/** What the register page passes back after a Stripe return. */
export interface StripeReturn {
  sessionId: string;
  reg: { ref: string; captain: string; partner: string; email: string } | null;
}
