'use server';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { slugify } from '@/lib/utils';

// Admin-only. Writes use the service-role client (bypasses RLS), so the
// admins allow-list must be enforced here in the action itself.
async function requireAdmin() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data, error } = await supabaseAdmin()
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !data) throw new Error('Unauthorized — account is not enrolled in the admins list.');
  return user;
}

export interface CategoryActionState {
  status: 'idle' | 'ok' | 'error';
  message?: string;
}

export async function createCategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  try {
    await requireAdmin();
    const name = String(formData.get('name') ?? '').trim();
    if (!name) return { status: 'error', message: 'Give the category a name.' };
    if (name.length > 60) return { status: 'error', message: 'Name is too long (max 60).' };

    const admin = supabaseAdmin();
    const slug = slugify(name);

    // Reject duplicate name/slug up front with a friendly message.
    const { data: existing } = await admin
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (existing) return { status: 'error', message: 'A category with that name already exists.' };

    // Append at the end of the sort order.
    const { data: last } = await admin
      .from('categories')
      .select('sort')
      .order('sort', { ascending: false })
      .limit(1)
      .maybeSingle();
    const sort = (last?.sort ?? 0) + 1;

    const { error } = await admin.from('categories').insert({ name, slug, sort });
    if (error) return { status: 'error', message: error.message };

    revalidatePath('/admin/categories');
    revalidatePath('/admin/products/new');
    return { status: 'ok', message: `Added “${name}”.` };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Could not add the category.' };
  }
}

export async function deleteCategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  try {
    await requireAdmin();
    const id = String(formData.get('id') ?? '');
    if (!id) return { status: 'error', message: 'Missing category.' };

    const admin = supabaseAdmin();
    // Products reference categories with a NOT-NULL foreign key — block the
    // delete (rather than orphan/cascade products) and tell the admin why.
    const { count } = await admin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);
    if ((count ?? 0) > 0) {
      return {
        status: 'error',
        message: `Can’t delete — ${count} product${count === 1 ? '' : 's'} still use this category. Move or delete them first.`,
      };
    }

    const { error } = await admin.from('categories').delete().eq('id', id);
    if (error) return { status: 'error', message: error.message };

    revalidatePath('/admin/categories');
    revalidatePath('/admin/products/new');
    return { status: 'ok', message: 'Category removed.' };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Could not delete the category.' };
  }
}
