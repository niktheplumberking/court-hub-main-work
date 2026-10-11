'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Admin sign-in runs on the server, so the session cookies can be httpOnly
 * (unreadable by any script in the browser — see lib/supabase/cookies.ts).
 *
 * - Same generic message for every failure: no hint whether an email exists.
 * - Throttled per IP and per email against password guessing.
 * - Non-admin accounts are signed straight back out.
 */
const GENERIC = 'Email or password is incorrect.';

export async function signIn(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 254);
  const password = String(formData.get('password') ?? '').slice(0, 200);
  if (!email || !password) return { error: GENERIC };

  const h = await headers();
  const ip = h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`login-ip:${ip}`, 10, 15 * 60_000) || !rateLimit(`login-email:${email}`, 5, 15 * 60_000)) {
    return { error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' };
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: GENERIC };

  const { data: admin } = await supabaseAdmin()
    .from('admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { error: GENERIC };
  }

  redirect('/admin');
}

export async function signOut(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
