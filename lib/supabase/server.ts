import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { hardenCookie } from './cookies';

/** Cookie-aware server client — respects RLS, knows the logged-in admin. */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, hardenCookie(options))
            );
          } catch {
            /* called from a Server Component — middleware handles refresh */
          }
        },
      },
    }
  );
}
