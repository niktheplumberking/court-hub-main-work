'use server';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CONTENT_DEFAULTS, type ContentPage } from '@/lib/content/get';

// Stricter than lib/actions/products.ts: content writes bypass RLS via the
// service-role client, so the admins ALLOW-LIST must be enforced here in the
// action itself — being authenticated is not enough (matters the moment any
// non-admin account exists, e.g. future customer logins). Requires the user
// to be enrolled in the `admins` table (see the site_content migration).
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

// Which route each page's content renders on — revalidated after every save
// so edits go live immediately (plain Next ISR revalidation: works on any
// Node host running `next start`, nothing Vercel-specific).
const PAGE_PATHS: Record<ContentPage, string> = {
  home: '/',
  about: '/about',
  contact: '/contact',
  construct: '/construct-your-court',
  faq: '/', // FAQ section is not currently mounted; home is its historic host
};

const MAX_TEXT = 500;
const MAX_RICHTEXT = 5000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
// Extension → the contentType we STORE (never trust the client's MIME: a
// "photo.png" declared as image/svg+xml would otherwise be served as
// scriptable SVG from the public bucket).
const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const ALLOWED_MIME = new Set(Object.values(IMAGE_TYPES));

export interface ContentActionState {
  status: 'idle' | 'saved' | 'reset' | 'error';
  message?: string;
}

export async function saveContentField(
  _prev: ContentActionState,
  formData: FormData
): Promise<ContentActionState> {
  try {
    await requireAdmin();

    const key = String(formData.get('key') ?? '');
    // Allowlist: only fields the code actually renders are editable. type/page/
    // label always come from the registry, never from the client.
    const field = CONTENT_DEFAULTS[key];
    if (!field) return { status: 'error', message: 'Unknown content field.' };

    let value: string;
    if (field.type === 'image') {
      const file = formData.get('image_file') as File | null;
      if (!file || file.size === 0) {
        return { status: 'error', message: 'Choose an image file first.' };
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return { status: 'error', message: 'Image too large (max 8MB).' };
      }
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const storedType = IMAGE_TYPES[ext];
      if (!storedType || !ALLOWED_MIME.has(file.type)) {
        return { status: 'error', message: 'Use a jpg, png or webp image.' };
      }
      const admin = supabaseAdmin();
      const path = `site-content/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await admin.storage.from('products').upload(path, file, {
        contentType: storedType, // derived from the extension, never the client MIME
        upsert: false,
      });
      if (error) return { status: 'error', message: `Upload failed: ${error.message}` };
      value = admin.storage.from('products').getPublicUrl(path).data.publicUrl;
    } else {
      value = String(formData.get('value') ?? '').trim();
      if (!value) return { status: 'error', message: 'Text cannot be empty (use Reset to restore the default).' };
      const cap = field.type === 'richtext' ? MAX_RICHTEXT : MAX_TEXT;
      if (value.length > cap) return { status: 'error', message: `Too long (max ${cap} characters).` };
    }

    const { error } = await supabaseAdmin().from('site_content').upsert({
      key,
      value, // JS string → stored as a JSON string in the jsonb column
      page: field.page,
      label: field.label,
      type: field.type,
    });
    if (error) return { status: 'error', message: error.message };

    revalidatePath(PAGE_PATHS[field.page]);
    revalidatePath('/admin/content');
    return { status: 'saved' };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Save failed.' };
  }
}

export async function resetContentField(
  _prev: ContentActionState,
  formData: FormData
): Promise<ContentActionState> {
  try {
    await requireAdmin();
    const key = String(formData.get('key') ?? '');
    const field = CONTENT_DEFAULTS[key];
    if (!field) return { status: 'error', message: 'Unknown content field.' };

    const { error } = await supabaseAdmin().from('site_content').delete().eq('key', key);
    if (error) return { status: 'error', message: error.message };

    revalidatePath(PAGE_PATHS[field.page]);
    revalidatePath('/admin/content');
    return { status: 'reset' };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Reset failed.' };
  }
}
