/**
 * Hardened options for the Supabase session cookies. Sign-in/out happen in
 * server actions (lib/actions/auth.ts), so no browser script ever needs these
 * cookies:
 *  - httpOnly: invisible to JavaScript → an injected script can't steal the session
 *  - secure:   only sent over HTTPS (production)
 *  - sameSite: 'lax' → not sent on cross-site POSTs (CSRF)
 */
export function hardenCookie<T extends Record<string, unknown> | undefined>(options: T) {
  return {
    ...(options ?? {}),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}
