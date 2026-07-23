'use client';
import { createContext, useContext } from 'react';
import { DEFAULT_LOCALE, dirFor, dirSign, localePath, type Dir, type Locale } from './locale';
import { getDict, type Dict } from './dict';

// Provided by each root layout — (en) passes 'en', (ar) passes 'ar'. Client
// chrome (navbars, footer, cart, tournament UI) reads locale/dir/strings from
// here instead of re-deriving per component.
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useDir(): Dir {
  return dirFor(useLocale());
}

/** -1 in RTL, 1 in LTR — multiply into directional x offsets/slides. */
export function useDirSign(): 1 | -1 {
  return dirSign(useLocale());
}

/** Localize an internal href for the active locale. */
export function useLocalePath(): (href: string) => string {
  const locale = useLocale();
  return (href: string) => localePath(locale, href);
}

/** The UI dictionary for the active locale. */
export function useT(): Dict {
  return getDict(useLocale());
}
