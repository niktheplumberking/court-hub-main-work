import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hardenCookie } from '@/lib/supabase/cookies';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Local preview without Supabase keys: auth cannot work at all (the client
  // below would throw and 500 every /admin request). Allow through in dev so
  // the admin stays reviewable; in production (env always set on Vercel) any
  // misconfiguration locks /admin instead of opening it.
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!configured) {
    if (process.env.NODE_ENV !== 'production') return response;
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, hardenCookie(options))
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname === '/admin/login';

  // Logged in is not enough: the account must be enrolled in the admins
  // allow-list (RLS on admins only lets an admin see their own row).
  let isAdmin = false;
  let lookupFailed = false;
  if (user) {
    const { data, error } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
    isAdmin = !!data;
    lookupFailed = !!error;
  }

  // Definitely not an admin (lookup succeeded, no row) → end that session.
  // A failed lookup (network blip) just denies this request without signing out.
  if (user && !isAdmin && !lookupFailed) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    const out = NextResponse.redirect(url);
    // Carry over the sign-out's cookie deletions (each keeps its own attributes).
    response.cookies.getAll().forEach((c) => out.cookies.set(c));
    return out;
  }

  if (!isAdmin && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }
  if (isAdmin && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = { matcher: ['/admin/:path*'] };
