'use client';

// ============================================================================
// Session-scoped store for the Tournaments feature.
//
// The demo persisted to localStorage; this repo forbids browser storage in
// components, so session mutations (a completed booking, an admin-created
// tournament, an edited points table) live in React state instead. Losing them
// on a full reload is acceptable (the seed data always renders). When Supabase
// lands, these actions become writes and the reads below become queries.
// ============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  TOURNAMENTS,
  type PointsTable,
  type Tier,
  type Tournament,
} from './data';
import { TIER_POINTS } from './points';

export interface Booking {
  slug: string;
  captain: string;
  partner: string;
  email: string;
  nat: string;
  ref: string;
}

interface ToastState {
  id: number;
  node: ReactNode;
}

interface TournamentStore {
  addTournament: (t: Tournament) => void;
  addBooking: (b: Booking) => void;
  setPoints: (tier: Tier, table: PointsTable) => void;
  allTournaments: () => Tournament[];
  getTournament: (slug: string) => Tournament | undefined;
  bookingsFor: (slug: string) => Booking[];
  pointsFor: (t: Tournament) => PointsTable;
  pointsForTier: (tier: Tier) => PointsTable;
  toast: (node: ReactNode) => void;
}

const Ctx = createContext<TournamentStore | null>(null);

export function TournamentStoreProvider({ children }: { children: ReactNode }) {
  const [extra, setExtra] = useState<Tournament[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pointsOverride, setPointsOverride] = useState<Partial<Record<Tier, PointsTable>>>({});
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const [mounted, setMounted] = useState(false);
  const toastId = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Portal target only exists on the client.
  useEffect(() => setMounted(true), []);

  const addTournament = useCallback((t: Tournament) => {
    setExtra((prev) => [t, ...prev]);
  }, []);

  const addBooking = useCallback((b: Booking) => {
    setBookings((prev) => [...prev, b]);
  }, []);

  const setPoints = useCallback((tier: Tier, table: PointsTable) => {
    setPointsOverride((prev) => ({ ...prev, [tier]: table }));
  }, []);

  const bookingsFor = useCallback(
    (slug: string) => bookings.filter((b) => b.slug === slug),
    [bookings],
  );

  // Effective registered count = base + session bookings, capped at capacity.
  const withReg = useCallback(
    (t: Tournament): Tournament => {
      const added = bookings.filter((b) => b.slug === t.slug).length;
      if (!added) return t;
      return { ...t, reg: Math.min(t.cap, t.reg + added) };
    },
    [bookings],
  );

  const allTournaments = useCallback(
    () => [...extra, ...TOURNAMENTS].map(withReg),
    [extra, withReg],
  );

  const getTournament = useCallback(
    (slug: string) => {
      const base = [...extra, ...TOURNAMENTS].find((t) => t.slug === slug);
      return base ? withReg(base) : undefined;
    },
    [extra, withReg],
  );

  const pointsForTier = useCallback(
    (tier: Tier): PointsTable => pointsOverride[tier] ?? TIER_POINTS[tier],
    [pointsOverride],
  );

  const pointsFor = useCallback(
    (t: Tournament): PointsTable => pointsForTier(t.tier),
    [pointsForTier],
  );

  const toast = useCallback((node: ReactNode) => {
    toastId.current += 1;
    setToastState({ id: toastId.current, node });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastState(null), 2600);
  }, []);

  const value = useMemo<TournamentStore>(
    () => ({
      addTournament,
      addBooking,
      setPoints,
      allTournaments,
      getTournament,
      bookingsFor,
      pointsFor,
      pointsForTier,
      toast,
    }),
    [addTournament, addBooking, setPoints, allTournaments, getTournament, bookingsFor, pointsFor, pointsForTier, toast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* Global toast (matches the demo). Portalled to <body> and mounted only
          while active, at its resting visible state — no entrance transition or
          animation (either can freeze off-screen depending on the environment).
          It simply appears bottom-centre and unmounts after the timeout. */}
      {mounted && toastState &&
        createPortal(
          <div
            key={toastState.id}
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-[14px] bg-ink px-[22px] py-3.5 text-[13.5px] font-semibold text-white shadow-[0_16px_40px_rgba(0,0,0,0.3)] [&_b]:text-lime"
          >
            {toastState.node}
          </div>,
          document.body,
        )}
    </Ctx.Provider>
  );
}

export function useTournamentStore(): TournamentStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTournamentStore must be used within TournamentStoreProvider');
  return ctx;
}
