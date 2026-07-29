'use server';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Lets the signed-in admin set their own password. Runs against the user's
 * OWN session (never the service key), so an admin can only ever change their
 * own credentials — and the password never passes through anyone else.
 */
export async function changeOwnPassword(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters.' };
  }
  if (password !== confirm) {
    return { ok: false, message: 'The two passwords do not match.' };
  }

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Your session expired. Sign in again.' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: error.message };

  return { ok: true, message: 'Password changed. Use the new one next time you sign in.' };
}
