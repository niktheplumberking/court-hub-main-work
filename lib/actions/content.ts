'use server';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CONTENT_DEFAULTS, type ContentPage } from '@/lib/content/get';

// Same auth gate as lib/actions/products.ts — middleware protects /admin,
// this protects the actions themselves; the site_content RLS policies
// (admins table) additionally protect the raw REST surface.
async function requireAdmin() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
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
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp']);

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
      if (!IMAGE_EXTS.has(ext) || !file.type.startsWith('image/')) {
        return { status: 'error', message: 'Use a jpg, png or webp image.' };
      }
      const admin = supabaseAdmin();
      const path = `site-content/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await admin.storage.from('products').upload(path, file, {
        contentType: file.type,
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
