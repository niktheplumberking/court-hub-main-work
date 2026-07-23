// ============================================================================
// Locale + direction — single source of truth (senior-arabic-rtl-dev doctrine:
// direction is data, derived in ONE module, never `if (locale === 'ar')`
// scattered around components).
// ============================================================================

export type Locale = 'en' | 'ar';

export const LOCALES: readonly Locale[] = ['en', 'ar'] as const;
export const DEFAULT_LOCALE: Locale = 'en';

const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur']);

export type Dir = 'ltr' | 'rtl';

export const dirFor = (locale: string): Dir =>
  RTL_LOCALES.has(locale.split('-')[0]) ? 'rtl' : 'ltr';

/** Direction sign for physical-axis animation values (x offsets, slides). */
export const dirSign = (locale: Locale): 1 | -1 => (dirFor(locale) === 'rtl' ? -1 : 1);

/**
 * Localize an internal path: '/' -> '/ar', '/shop' -> '/ar/shop' for Arabic;
 * English paths pass through untouched. External/anchor/mail links untouched.
 */
export function localePath(locale: Locale, href: string): string {
  if (locale === 'en') return href;
  if (!href.startsWith('/')) return href; // external, #anchor, mailto:, wa.me
  if (href === '/ar' || href.startsWith('/ar/')) return href; // already localized
  return href === '/' ? '/ar' : `/ar${href}`;
}

/** The same page in the other locale (drives the language switcher). */
export function switchLocalePath(current: Locale, pathname: string): string {
  if (current === 'ar') {
    const stripped = pathname === '/ar' ? '/' : pathname.replace(/^\/ar(?=\/)/, '');
    return stripped || '/';
  }
  return pathname === '/' ? '/ar' : `/ar${pathname}`;
}

/** Strip the locale prefix — canonical route identity (swipe page order etc.). */
export function stripLocale(pathname: string): string {
  if (pathname === '/ar') return '/';
  return pathname.replace(/^\/ar(?=\/)/, '');
}
