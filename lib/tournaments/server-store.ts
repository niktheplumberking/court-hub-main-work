// ============================================================================
// Tournaments server store. SERVER ONLY - never import from client components
// (import types from lib/tournaments/admin-types instead).
//
// This is the single data-access layer for the real tournaments backend at
// /admin/tournaments. It currently keeps everything in process memory, seeded
// from the approved demo dataset in data.ts, so the admin is fully usable and
// every change reflects on the public site immediately. Changes reset on a
// server restart or redeploy: that is the agreed staging behaviour until the
// dedicated Supabase project is integrated at the final stage.
//
// The developer wiring Supabase later should keep every exported function
// signature identical and replace the bodies with table reads/writes:
// tournaments, registrations, tier_points, leaderboard_rows, groups(+teams),
// matches, schedule. Nothing outside this file needs to change.
// ============================================================================
import {
  BRACKET,
  GROUP_A,
  GROUP_B,
  LEADERBOARD,
  SCHEDULE_DXB,
  TOURNAMENTS,
  type Bracket,
  type GroupStanding,
  type Match,
  type Pair,
  type PointsTable,
  type ScheduleDay,
  type Tier,
  type Tournament,
} from './data';
import { TIER_POINTS } from './points';
import type {
  GroupData,
  GroupTeamRow,
  LeaderboardEntry,
  MatchData,
  MatchSlot,
  Registration,
  ScheduleRowData,
  TournamentDetailData,
} from './admin-types';

interface TournamentsDB {
  tournaments: Tournament[];
  registrations: Registration[];
  tierPoints: Record<Tier, PointsTable>;
  leaderboard: LeaderboardEntry[];
  groups: Record<string, GroupData[]>;
  brackets: Record<string, Partial<Record<MatchSlot, MatchData>>>;
  schedules: Record<string, ScheduleRowData[]>;
}

const uid = () => crypto.randomUUID();

function seedDB(): TournamentsDB {
  const groupToData = (label: string, rows: GroupStanding[], sort: number): GroupData => ({
    id: uid(),
    label,
    sort,
    teams: rows.map((r, i) => ({
      id: uid(),
      pairName: r.t.name,
      p1: r.t.p1,
      p2: r.t.p2,
      nat: r.t.nat,
      P: r.P,
      W: r.W,
      L: r.L,
      SF: r.SF,
      SA: r.SA,
      PTS: r.PTS,
      q: r.q,
      sort: i,
    })),
  });

  const matchToData = (slot: MatchSlot, m: Match): MatchData => ({
    slot,
    label: m.label,
    aName: m.a?.name ?? '',
    aNat: m.a?.nat ?? '',
    bName: m.b?.name ?? '',
    bNat: m.b?.nat ?? '',
    sa: [...m.sa],
    sb: [...m.sb],
    status: m.status,
    court: m.court,
    time: m.time,
  });

  let sort = 0;
  const schedule: ScheduleRowData[] = SCHEDULE_DXB.flatMap((d) =>
    d.evs.map((e) => ({
      id: uid(),
      day: d.d,
      // The store keeps the FULL sublabel (month + weekday) so admin-created
      // events in other months render correctly.
      dow: `Jul ${d.dow}`,
      time: e.t,
      title: e.n,
      venue: e.v,
      state: e.s,
      sort: sort++,
    })),
  );

  return {
    tournaments: TOURNAMENTS.map((t) => ({ ...t, result: t.result ? { ...t.result } : undefined })),
    registrations: [],
    tierPoints: {
      P25: { ...TIER_POINTS.P25 },
      P50: { ...TIER_POINTS.P50 },
      P100: { ...TIER_POINTS.P100 },
      P250: { ...TIER_POINTS.P250 },
    },
    leaderboard: LEADERBOARD.map((r, i) => ({ ...r, id: uid(), sort: i })),
    groups: { 'dubai-open': [groupToData('A', GROUP_A, 0), groupToData('B', GROUP_B, 1)] },
    brackets: {
      'dubai-open': {
        sf1: matchToData('sf1', BRACKET.sf[0]),
        sf2: matchToData('sf2', BRACKET.sf[1]),
        final: matchToData('final', BRACKET.final),
        third: matchToData('third', BRACKET.third),
      },
    },
    schedules: { 'dubai-open': schedule },
  };
}

// globalThis cache: survives dev HMR and module re-evaluation within a process.
const g = globalThis as unknown as { __chTournamentsDB?: TournamentsDB };
function db(): TournamentsDB {
  if (!g.__chTournamentsDB) g.__chTournamentsDB = seedDB();
  return g.__chTournamentsDB;
}

// Registrations that occupy a spot.
const countsToCap = (r: Registration) => r.status === 'demo' || r.status === 'paid';

/** Effective registered count: base number plus live bookings, capped. */
function withEffectiveReg(t: Tournament): Tournament {
  const booked = db().registrations.filter((r) => r.slug === t.slug && countsToCap(r)).length;
  return booked ? { ...t, reg: Math.min(t.cap, t.reg + booked) } : { ...t };
}

// ---------------------------------------------------------------------------
// Reads (public site + admin)
// ---------------------------------------------------------------------------

export async function listTournaments(): Promise<Tournament[]> {
  return db().tournaments.map(withEffectiveReg);
}

export async function getTournament(slug: string): Promise<Tournament | undefined> {
  const t = db().tournaments.find((x) => x.slug === slug);
  return t ? withEffectiveReg(t) : undefined;
}

const matchFromData = (m: MatchData): Match => ({
  id: m.slot,
  label: m.label,
  a: m.aName ? { id: `${m.slot}-a`, name: m.aName, p1: '', p2: '', nat: m.aNat } : null,
  b: m.bName ? { id: `${m.slot}-b`, name: m.bName, p1: '', p2: '', nat: m.bNat } : null,
  sa: [...m.sa],
  sb: [...m.sb],
  status: m.status,
  court: m.court,
  time: m.time,
});

const emptyMatch = (slot: MatchSlot, label: string): Match => ({
  id: slot,
  label,
  a: null,
  b: null,
  sa: [],
  sb: [],
  status: 'soon',
  court: '',
  time: '',
});

export async function getBracketFor(slug: string): Promise<Bracket | null> {
  const slots = db().brackets[slug];
  if (!slots || Object.keys(slots).length === 0) return null;
  return {
    sf: [
      slots.sf1 ? matchFromData(slots.sf1) : emptyMatch('sf1', 'Semifinal 1'),
      slots.sf2 ? matchFromData(slots.sf2) : emptyMatch('sf2', 'Semifinal 2'),
    ],
    final: slots.final ? matchFromData(slots.final) : emptyMatch('final', 'Final'),
    third: slots.third ? matchFromData(slots.third) : emptyMatch('third', '3rd Place'),
  };
}

/** The in-progress final of the live tournament, for the hub banner. */
export async function getLiveFinal(): Promise<Match | null> {
  const live = db().tournaments.find((t) => t.status === 'live');
  if (!live) return null;
  const final = db().brackets[live.slug]?.final;
  return final ? matchFromData(final) : null;
}

export async function getGroupsFor(slug: string): Promise<{ label: string; rows: GroupStanding[] }[]> {
  const groups = db().groups[slug] ?? [];
  return [...groups]
    .sort((a, b) => a.sort - b.sort)
    .map((gr) => ({
      label: gr.label,
      rows: [...gr.teams]
        .sort((a, b) => a.sort - b.sort)
        .map((tm) => ({
          t: { id: tm.id, name: tm.pairName, p1: tm.p1, p2: tm.p2, nat: tm.nat },
          P: tm.P,
          W: tm.W,
          L: tm.L,
          SF: tm.SF,
          SA: tm.SA,
          PTS: tm.PTS,
          q: tm.q,
        })),
    }));
}

export async function getScheduleFor(slug: string): Promise<ScheduleDay[]> {
  const rows = [...(db().schedules[slug] ?? [])].sort((a, b) => a.sort - b.sort);
  const days: ScheduleDay[] = [];
  for (const r of rows) {
    let day = days.find((d) => d.d === r.day);
    if (!day) {
      day = { d: r.day, dow: r.dow, evs: [] };
      days.push(day);
    }
    day.evs.push({ t: r.time, n: r.title, v: r.venue, s: r.state });
  }
  return days;
}

/** Booked pairs for the public Teams tab (names and nationality only). */
export async function getTeamsFor(slug: string): Promise<Pair[]> {
  const last = (s: string) => s.trim().split(' ').pop() ?? '';
  return db()
    .registrations.filter((r) => r.slug === slug && countsToCap(r))
    .map((r) => ({
      id: r.id,
      name: `${last(r.captain)} / ${last(r.partner)}`,
      p1: r.captain,
      p2: r.partner,
      nat: r.nat || '–',
    }));
}

export async function getTierPointsMap(): Promise<Record<Tier, PointsTable>> {
  const tp = db().tierPoints;
  return {
    P25: { ...tp.P25 },
    P50: { ...tp.P50 },
    P100: { ...tp.P100 },
    P250: { ...tp.P250 },
  };
}

export async function getLeaderboardRows(): Promise<LeaderboardEntry[]> {
  return [...db().leaderboard].sort((a, b) => a.sort - b.sort).map((r) => ({ ...r }));
}

export async function getDetailData(slug: string): Promise<TournamentDetailData | null> {
  const t = await getTournament(slug);
  if (!t) return null;
  const [points, groups, bracket, schedule, teams] = await Promise.all([
    getTierPointsMap().then((m) => m[t.tier]),
    getGroupsFor(slug),
    getBracketFor(slug),
    getScheduleFor(slug),
    getTeamsFor(slug),
  ]);
  return { tournament: t, points, groups, bracket, schedule, teams };
}

// Raw editor rows (with ids) for the admin manage page. The public read
// shapes above drop ids; the editors need them for per-row save/delete.
export async function getGroupsRaw(slug: string): Promise<GroupData[]> {
  return [...(db().groups[slug] ?? [])]
    .sort((a, b) => a.sort - b.sort)
    .map((gr) => ({ ...gr, teams: [...gr.teams].sort((a, b) => a.sort - b.sort).map((t) => ({ ...t })) }));
}

export async function getMatchesRaw(slug: string): Promise<Partial<Record<MatchSlot, MatchData>>> {
  const slots = db().brackets[slug] ?? {};
  const out: Partial<Record<MatchSlot, MatchData>> = {};
  for (const key of Object.keys(slots) as MatchSlot[]) {
    const m = slots[key];
    if (m) out[key] = { ...m, sa: [...m.sa], sb: [...m.sb] };
  }
  return out;
}

export async function getScheduleRaw(slug: string): Promise<ScheduleRowData[]> {
  return [...(db().schedules[slug] ?? [])].sort((a, b) => a.sort - b.sort).map((r) => ({ ...r }));
}

export async function listRegistrations(slug?: string): Promise<Registration[]> {
  const all = slug ? db().registrations.filter((r) => r.slug === slug) : db().registrations;
  return [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => ({ ...r }));
}

export async function getRegistrationBySession(sessionId: string): Promise<Registration | undefined> {
  const r = db().registrations.find((x) => x.stripeSessionId === sessionId);
  return r ? { ...r } : undefined;
}

// ---------------------------------------------------------------------------
// Writes (admin actions + booking)
// ---------------------------------------------------------------------------

export async function upsertTournament(t: Tournament, originalSlug?: string): Promise<void> {
  const d = db();
  const key = originalSlug ?? t.slug;
  const i = d.tournaments.findIndex((x) => x.slug === key);
  if (i === -1) {
    d.tournaments.unshift(t);
    return;
  }
  d.tournaments[i] = t;
  // Slug rename: re-key everything attached to the old slug.
  if (originalSlug && originalSlug !== t.slug) {
    for (const r of d.registrations) if (r.slug === originalSlug) r.slug = t.slug;
    if (d.groups[originalSlug]) {
      d.groups[t.slug] = d.groups[originalSlug];
      delete d.groups[originalSlug];
    }
    if (d.brackets[originalSlug]) {
      d.brackets[t.slug] = d.brackets[originalSlug];
      delete d.brackets[originalSlug];
    }
    if (d.schedules[originalSlug]) {
      d.schedules[t.slug] = d.schedules[originalSlug];
      delete d.schedules[originalSlug];
    }
  }
}

export async function removeTournament(slug: string): Promise<void> {
  const d = db();
  d.tournaments = d.tournaments.filter((t) => t.slug !== slug);
  d.registrations = d.registrations.filter((r) => r.slug !== slug);
  delete d.groups[slug];
  delete d.brackets[slug];
  delete d.schedules[slug];
}

export async function slugExists(slug: string): Promise<boolean> {
  return db().tournaments.some((t) => t.slug === slug);
}

export async function addRegistration(
  input: Omit<Registration, 'id' | 'ref' | 'createdAt'> & { ref?: string },
): Promise<Registration> {
  const reg: Registration = {
    ...input,
    id: uid(),
    ref: input.ref ?? 'CH-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    createdAt: new Date().toISOString(),
  };
  db().registrations.push(reg);
  return { ...reg };
}

export async function setRegistrationStatus(id: string, status: Registration['status']): Promise<void> {
  const r = db().registrations.find((x) => x.id === id);
  if (r) r.status = status;
}

export async function removeRegistration(id: string): Promise<void> {
  const d = db();
  d.registrations = d.registrations.filter((r) => r.id !== id);
}

export async function setTierPoints(tier: Tier, table: PointsTable): Promise<void> {
  db().tierPoints[tier] = { ...table };
}

export async function upsertLeaderboardRow(row: Omit<LeaderboardEntry, 'id'> & { id?: string }): Promise<void> {
  const d = db();
  if (row.id) {
    const i = d.leaderboard.findIndex((x) => x.id === row.id);
    if (i !== -1) {
      d.leaderboard[i] = { ...row, id: row.id };
      return;
    }
  }
  d.leaderboard.push({ ...row, id: uid() });
}

export async function removeLeaderboardRow(id: string): Promise<void> {
  const d = db();
  d.leaderboard = d.leaderboard.filter((r) => r.id !== id);
}

export async function addGroup(slug: string, label: string): Promise<void> {
  const d = db();
  const list = d.groups[slug] ?? (d.groups[slug] = []);
  if (list.some((gr) => gr.label.toLowerCase() === label.toLowerCase())) return;
  list.push({ id: uid(), label, sort: list.length, teams: [] });
}

export async function removeGroup(slug: string, groupId: string): Promise<void> {
  const d = db();
  d.groups[slug] = (d.groups[slug] ?? []).filter((gr) => gr.id !== groupId);
}

export async function upsertGroupTeam(
  slug: string,
  groupId: string,
  team: Omit<GroupTeamRow, 'id'> & { id?: string },
): Promise<void> {
  const gr = (db().groups[slug] ?? []).find((x) => x.id === groupId);
  if (!gr) return;
  if (team.id) {
    const i = gr.teams.findIndex((x) => x.id === team.id);
    if (i !== -1) {
      gr.teams[i] = { ...team, id: team.id };
      return;
    }
  }
  gr.teams.push({ ...team, id: uid() });
}

export async function removeGroupTeam(slug: string, groupId: string, teamId: string): Promise<void> {
  const gr = (db().groups[slug] ?? []).find((x) => x.id === groupId);
  if (gr) gr.teams = gr.teams.filter((t) => t.id !== teamId);
}

export async function setMatch(slug: string, match: MatchData): Promise<void> {
  const d = db();
  const slots = d.brackets[slug] ?? (d.brackets[slug] = {});
  slots[match.slot] = { ...match };
}

export async function clearMatch(slug: string, slot: MatchSlot): Promise<void> {
  const slots = db().brackets[slug];
  if (slots) delete slots[slot];
}

export async function upsertScheduleRow(
  slug: string,
  row: Omit<ScheduleRowData, 'id'> & { id?: string },
): Promise<void> {
  const d = db();
  const list = d.schedules[slug] ?? (d.schedules[slug] = []);
  if (row.id) {
    const i = list.findIndex((x) => x.id === row.id);
    if (i !== -1) {
      list[i] = { ...row, id: row.id };
      return;
    }
  }
  list.push({ ...row, id: uid() });
}

export async function removeScheduleRow(slug: string, id: string): Promise<void> {
  const d = db();
  d.schedules[slug] = (d.schedules[slug] ?? []).filter((r) => r.id !== id);
}
