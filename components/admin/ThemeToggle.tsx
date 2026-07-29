'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export const ADMIN_THEME_COOKIE = 'ch-admin-theme';
export type AdminTheme = 'dark' | 'light';

/** Reads the console theme on the client (login screen has no server read). */
export function readThemeCookie(): AdminTheme {
  const m = document.cookie.match(/(?:^|;\s*)ch-admin-theme=(light|dark)/);
  return m?.[1] === 'light' ? 'light' : 'dark';
}

/**
 * Dark/light switch for the admin console only. The choice rides in a cookie
 * so the SERVER can stamp `data-admin-theme` on the admin wrapper during
 * render — no flash, no inline boot script. Every light-mode rule in
 * globals.css is scoped to that wrapper, so the public site is untouchable.
 */
export default function ThemeToggle({ initial = 'dark' }: { initial?: AdminTheme }) {
  const [theme, setTheme] = useState<AdminTheme>(initial);

  useEffect(() => {
    setTheme(readThemeCookie());
  }, []);

  const toggle = () => {
    const next: AdminTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.cookie = `${ADMIN_THEME_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    // Apply immediately on this page; the cookie handles every later render.
    document.querySelectorAll('.adm-root').forEach((el) => {
      (el as HTMLElement).dataset.adminTheme = next;
    });
  };

  return (
    <button
      onClick={toggle}
      type="button"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      className="flex items-center justify-center w-9 h-9 rounded-full border border-white/15 text-white/50 hover:border-lime hover:text-lime transition-colors cursor-pointer"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
