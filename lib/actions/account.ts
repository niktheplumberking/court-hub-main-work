'use server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Lets the signed-in admin set their own password. Runs against the user's
 * OWN session (never the service key), so an admin can only ever change their
 * own credentials — and the password never passes through anyone else.
 */
export async function changeOwnPassword(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  const current = String(formData.get('current') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (password.length < 10) {
    return { ok: false, message: 'Password must be at least 10 characters.' };
  }
  if (password.length > 200) {
    return { ok: false, message: 'Password is too long.' };
  }
  if (password !== confirm) {
    return { ok: false, message: 'The two passwords do not match.' };
  }

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, message: 'Your session expired. Sign in again.' };

  if (!rateLimit(`pwchange:${user.id}`, 5, 15 * 60_000)) {
    return { ok: false, message: 'Too many attempts. Please wait 15 minutes.' };
  }

  // Re-prove identity: someone at an unlocked, signed-in computer must not be
  // able to take the account over. Checked with a throwaway client so it
  // never touches the real session cookies.
  const verifier = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: wrongCurrent } = await verifier.auth.signInWithPassword({ email: user.email, password: current });
  if (wrongCurrent) return { ok: false, message: 'Your current password is incorrect.' };
  await verifier.auth.signOut();
  if (current === password) return { ok: false, message: 'The new password must be different from the current one.' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: error.message };

  return { ok: true, message: 'Password changed. Use the new one next time you sign in.' };
}
