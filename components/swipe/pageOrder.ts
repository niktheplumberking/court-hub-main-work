// The horizontal swipe cycle: Home → About → Construct → Shop → Contact (loops).
// Product detail (/shop/[slug]) is a drill-down, not part of the swipe sequence.
export const PAGE_ORDER = [
  '/',
  '/about',
  '/construct-your-court',
  '/shop',
  '/contact',
] as const;

export type SwipePath = (typeof PAGE_ORDER)[number];

/** Index of a path in the swipe order, or -1 if it isn't a swipe page. */
export function orderIndex(pathname: string): number {
  return (PAGE_ORDER as readonly string[]).indexOf(pathname);
}

/** The previous/next swipe targets (looping), given the current pathname. */
export function neighbors(pathname: string): { prev: string; next: string } | null {
  const i = orderIndex(pathname);
  if (i === -1) return null;
  const n = PAGE_ORDER.length;
  return {
    prev: PAGE_ORDER[(i - 1 + n) % n],
    next: PAGE_ORDER[(i + 1) % n],
  };
}

/** Swipe direction (1 = forward/right, -1 = back/left) between two paths. */
export function swipeDirection(prevPath: string, nextPath: string): number {
  const pi = orderIndex(prevPath);
  const ci = orderIndex(nextPath);
  if (pi === -1 || ci === -1) return 1;
  let dir = ci > pi ? 1 : -1;
  const last = PAGE_ORDER.length - 1;
  if (pi === last && ci === 0) dir = 1; // wrap forward (Contact → About)
  if (pi === 0 && ci === last) dir = -1; // wrap back (About → Contact)
  return dir;
}
