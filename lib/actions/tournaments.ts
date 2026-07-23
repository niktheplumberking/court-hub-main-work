'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import type { Division, Tier, Tournament, TournamentStatus, PointsTable } from '@/lib/tournaments/data';
import type { MatchSlot, RegistrationStatus } from '@/lib/tournaments/admin-types';
import {
  addGroup as storeAddGroup,
  addRegistration,
  getTournament,
  removeGroup as storeRemoveGroup,
  removeGroupTeam as storeRemoveGroupTeam,
  removeLeaderboardRow as storeRemoveLeaderboardRow,
  removeRegistration as storeRemoveRegistration,
  removeScheduleRow as storeRemoveScheduleRow,
  removeTournament as storeRemoveTournament,
  setMatch,
  setRegistrationStatus,
  setTierPoints,
  slugExists,
  upsertGroupTeam,
  upsertLeaderboardRow,
  upsertScheduleRow,
  upsertTournament,
} from '@/lib/tournaments/server-store';

// Same login gate as lib/actions/products.ts. When Supabase env is absent
// (local preview without keys) auth cannot work at all; allow in dev only so
// the admin stays reviewable locally. Production always enforces the login.
async function requireAdmin() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!configured) {
    if (process.env.NODE_ENV !== 'production') return null;
    throw new Error('Unauthorized');
  }
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

function revalidateTournamentPages() {
  revalidatePath('/tournaments');
  revalidatePath('/tournaments/[slug]', 'page');
  revalidatePath('/tournaments/[slug]/[tab]', 'page');
  revalidatePath('/tournaments/[slug]/register', 'page');
  revalidatePath('/leaderboards');
  revalidatePath('/admin/tournaments');
  revalidatePath('/admin/tournaments/[slug]', 'page');
  revalidatePath('/admin/tournaments/[slug]/manage', 'page');
}

const str = (fd: FormData, key: string) => ((fd.get(key) as string) ?? '').trim();
const num = (fd: FormData, key: string, fallback = 0) => {
  const n = Number(fd.get(key));
  return Number.isFinite(n) ? n : fallback;
};

function cleanSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Tournament CRUD
// ---------------------------------------------------------------------------

export async function saveTournament(formData: FormData) {
  await requireAdmin();

  const originalSlug = str(formData, 'original_slug') || undefined;
  const name = str(formData, 'name');
  if (!name) throw new Error('Name is required');

  let slug = str(formData, 'slug') ? cleanSlug(str(formData, 'slug')) : cleanSlug(name);
  if (!slug) throw new Error('Slug could not be derived from the name');
  if (slug !== originalSlug && (await slugExists(slug))) {
    // Clean human slugs, uniqueness enforced with a short suffix on collision.
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const status = (str(formData, 'status') || 'open') as TournamentStatus;

  // Final result: only kept for completed events with a champion filled in.
  const championName = str(formData, 'result_champion_name');
  const result =
    status === 'done' && championName
      ? {
          champion: { name: championName, nat: str(formData, 'result_champion_nat') },
          runnerUp: { name: str(formData, 'result_runnerup_name'), nat: str(formData, 'result_runnerup_nat') },
          third: { name: str(formData, 'result_third_name'), nat: str(formData, 'result_third_nat') },
          score: str(formData, 'result_score'),
        }
      : undefined;

  const tournament: Tournament = {
    slug,
    name,
    tier: (str(formData, 'tier') || 'P100') as Tier,
    division: (str(formData, 'division') || 'Men') as Division,
    status,
    dates: str(formData, 'dates') || 'TBC 2026',
    venue: str(formData, 'venue') || 'Court Hub Arena, Al Quoz',
    format: str(formData, 'format') || 'Groups + Knockout',
    cap: Math.max(1, num(formData, 'cap', 16)),
    reg: Math.max(0, num(formData, 'reg', 0)),
    fee: Math.max(0, num(formData, 'fee', 0)),
    prize: Math.max(0, num(formData, 'prize', 0)),
    cover: str(formData, 'cover') || '/images/court_action_landscape_1779705580138.webp',
    blurb: str(formData, 'blurb'),
    hasBracket: formData.get('has_bracket') === 'on' || undefined,
    result,
  };

  await upsertTournament(tournament, originalSlug);
  revalidateTournamentPages();
  redirect('/admin/tournaments');
}

export async function deleteTournament(slug: string) {
  await requireAdmin();
  await storeRemoveTournament(slug);
  revalidateTournamentPages();
}

// ---------------------------------------------------------------------------
// Tier points + leaderboard
// ---------------------------------------------------------------------------

export async function saveTierPoints(formData: FormData) {
  await requireAdmin();
  const tier = str(formData, 'tier') as Tier;
  if (!['P25', 'P50', 'P100', 'P250'].includes(tier)) throw new Error('Unknown tier');
  const table: PointsTable = {
    Winner: num(formData, 'Winner'),
    Finalist: num(formData, 'Finalist'),
    Semifinal: num(formData, 'Semifinal'),
    Quarterfinal: num(formData, 'Quarterfinal'),
    Group: num(formData, 'Group'),
    Entry: num(formData, 'Entry'),
  };
  await setTierPoints(tier, table);
  revalidateTournamentPages();
}

export async function saveLeaderboardRow(formData: FormData) {
  await requireAdmin();
  const name = str(formData, 'name');
  if (!name) throw new Error('Pair name is required');
  await upsertLeaderboardRow({
    id: str(formData, 'id') || undefined,
    mv: num(formData, 'mv'),
    name,
    nat: str(formData, 'nat'),
    div: (str(formData, 'div') || 'Men') as 'Men' | 'Women' | 'Mixed',
    ev: num(formData, 'ev'),
    titles: num(formData, 'titles'),
    pts: num(formData, 'pts'),
    sort: num(formData, 'sort'),
  });
  revalidateTournamentPages();
}

export async function deleteLeaderboardRow(id: string) {
  await requireAdmin();
  await storeRemoveLeaderboardRow(id);
  revalidateTournamentPages();
}

// ---------------------------------------------------------------------------
// Groups + standings
// ---------------------------------------------------------------------------

export async function createGroup(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, 'slug');
  const label = str(formData, 'label').toUpperCase();
  if (!slug || !label) throw new Error('Group label is required');
  await storeAddGroup(slug, label);
  revalidateTournamentPages();
}

export async function deleteGroup(slug: string, groupId: string) {
  await requireAdmin();
  await storeRemoveGroup(slug, groupId);
  revalidateTournamentPages();
}

export async function saveGroupTeam(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, 'slug');
  const groupId = str(formData, 'group_id');
  const pairName = str(formData, 'pair_name');
  if (!slug || !groupId || !pairName) throw new Error('Pair name is required');
  await upsertGroupTeam(slug, groupId, {
    id: str(formData, 'id') || undefined,
    pairName,
    p1: str(formData, 'p1'),
    p2: str(formData, 'p2'),
    nat: str(formData, 'nat'),
    P: num(formData, 'P'),
    W: num(formData, 'W'),
    L: num(formData, 'L'),
    SF: num(formData, 'SF'),
    SA: num(formData, 'SA'),
    PTS: num(formData, 'PTS'),
    q: formData.get('q') === 'on',
    sort: num(formData, 'sort'),
  });
  revalidateTournamentPages();
}

export async function deleteGroupTeam(slug: string, groupId: string, teamId: string) {
  await requireAdmin();
  await storeRemoveGroupTeam(slug, groupId, teamId);
  revalidateTournamentPages();
}

// ---------------------------------------------------------------------------
// Knockout matches
// ---------------------------------------------------------------------------

const parseSets = (raw: string): number[] =>
  raw
    .split(/[,\s]+/)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n >= 0);

export async function saveMatch(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, 'slug');
  const slot = str(formData, 'slot') as MatchSlot;
  if (!slug || !['sf1', 'sf2', 'final', 'third'].includes(slot)) throw new Error('Unknown match slot');
  const sa = parseSets(str(formData, 'sa'));
  const sb = parseSets(str(formData, 'sb'));
  if (sa.length !== sb.length) throw new Error('Both pairs need the same number of set scores');
  await setMatch(slug, {
    slot,
    label: str(formData, 'label') || slot.toUpperCase(),
    aName: str(formData, 'a_name'),
    aNat: str(formData, 'a_nat').toUpperCase(),
    bName: str(formData, 'b_name'),
    bNat: str(formData, 'b_nat').toUpperCase(),
    sa,
    sb,
    status: (str(formData, 'status') || 'soon') as 'done' | 'live' | 'soon',
    court: str(formData, 'court'),
    time: str(formData, 'time'),
  });
  revalidateTournamentPages();
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

export async function saveScheduleRow(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, 'slug');
  const title = str(formData, 'title');
  if (!slug || !title) throw new Error('Event title is required');
  await upsertScheduleRow(slug, {
    id: str(formData, 'id') || undefined,
    day: str(formData, 'day'),
    dow: str(formData, 'dow'),
    time: str(formData, 'time'),
    title,
    venue: str(formData, 'venue'),
    state: (str(formData, 'state') || 'soon') as 'done' | 'live' | 'soon',
    sort: num(formData, 'sort'),
  });
  revalidateTournamentPages();
}

export async function deleteScheduleRow(slug: string, id: string) {
  await requireAdmin();
  await storeRemoveScheduleRow(slug, id);
  revalidateTournamentPages();
}

// ---------------------------------------------------------------------------
// Registrations (admin)
// ---------------------------------------------------------------------------

export async function updateRegistrationStatus(id: string, status: RegistrationStatus) {
  await requireAdmin();
  await setRegistrationStatus(id, status);
  revalidateTournamentPages();
}

export async function deleteRegistration(id: string) {
  await requireAdmin();
  await storeRemoveRegistration(id);
  revalidateTournamentPages();
}

// ---------------------------------------------------------------------------
// Public: booking (demo payment path). No auth on purpose - this is the
// public entry form. All validation happens here, server-side.
// ---------------------------------------------------------------------------

export interface CreateRegistrationInput {
  slug: string;
  captain: string;
  email: string;
  phone: string;
  nat: string;
  level: string;
  partner: string;
  pcontact: string;
  method: string;
}

export interface CreateRegistrationResult {
  ok: boolean;
  ref?: string;
  error?: string;
}

export async function createRegistration(
  input: CreateRegistrationInput,
): Promise<CreateRegistrationResult> {
  const captain = input.captain?.trim();
  const email = input.email?.trim();
  const partner = input.partner?.trim();
  if (!captain || !email || !partner) return { ok: false, error: 'Please fill the required fields.' };
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return { ok: false, error: 'Please enter a valid email.' };

  const t = await getTournament(input.slug);
  if (!t) return { ok: false, error: 'This tournament no longer exists.' };
  if (t.status !== 'open') return { ok: false, error: 'Registration for this event is closed.' };
  if (t.reg >= t.cap) return { ok: false, error: 'This event is full.' };

  const reg = await addRegistration({
    slug: t.slug,
    captain,
    email,
    phone: input.phone?.trim() ?? '',
    nat: input.nat?.trim() ?? '',
    level: input.level?.trim() ?? '',
    partner,
    pcontact: input.pcontact?.trim() ?? '',
    method: input.method || 'card',
    status: 'demo',
    amount: t.fee,
  });
  revalidateTournamentPages();
  return { ok: true, ref: reg.ref };
}
