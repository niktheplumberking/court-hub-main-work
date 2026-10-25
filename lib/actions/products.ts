'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { slugify } from '@/lib/utils';

// Every storefront surface that renders products, in both languages: the shop
// grid, each product page, and the homepage top-sellers rail.
function revalidateStorefront() {
  for (const path of ['/', '/ar', '/shop', '/ar/shop']) revalidatePath(path);
  revalidatePath('/shop/[slug]', 'page');
  revalidatePath('/ar/shop/[slug]', 'page');
  revalidatePath('/admin/products');
}

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireAdmin() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  // Allow-list check (same gate as content/categories): being authenticated is
  // not enough — the account must be enrolled in the admins table. Keeps the
  // admin closed even if dashboard signups are ever re-enabled.
  const { data, error } = await supabaseAdmin()
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !data) throw new Error('Unauthorized, account is not enrolled in the admins list.');
  return user;
}

export async function saveProduct(formData: FormData) {
  await requireAdmin();
  const admin = supabaseAdmin();

  const id = (formData.get('id') as string) || null;
  const title = (formData.get('title') as string)?.trim();
  if (!title) throw new Error('Title is required');

  // Upload any new images to Supabase Storage. Only real image types are
  // accepted, and the stored extension/content-type come from that allow-list
  // (never the uploaded file name), so nothing else can be hosted in the
  // public bucket.
  const files = formData.getAll('image_files') as File[];
  const uploaded: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const ext = IMAGE_TYPES[file.type];
    if (!ext) throw new Error(`"${file.name}" is not a JPG, PNG, WebP, AVIF or GIF image.`);
    if (file.size > MAX_IMAGE_BYTES) throw new Error(`"${file.name}" is larger than 10 MB.`);
    const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    // Upload the original File bytes: never resize, re-encode or replace it
    // with a thumbnail. The admin's dimension check is advisory only.
    const { error } = await admin.storage.from('products').upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const { data } = admin.storage.from('products').getPublicUrl(path);
    uploaded.push(data.publicUrl);
  }

  let existingImages: string[] = [];
  try {
    const parsed = JSON.parse((formData.get('existing_images') as string) || '[]');
    if (Array.isArray(parsed)) existingImages = parsed.filter((u): u is string => typeof u === 'string' && (u.startsWith('https://') || (u.startsWith('/') && !u.startsWith('//'))));
  } catch {
    existingImages = [];
  }
  const price = Number(formData.get('price_aed') || 0);
  const quantity = Number(formData.get('quantity') || 1);
  const compareRaw = formData.get('compare_at_price');
  const compare = compareRaw ? Number(compareRaw) : null;
  const status = (formData.get('status') as string) || 'draft';
  const condition = (formData.get('condition') as string) || null;
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000) throw new Error('Price must be a number between 0 and 1,000,000.');
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100_000) throw new Error('Quantity must be a whole number from 0 to 100,000.');
  if (compare !== null && (!Number.isFinite(compare) || compare < 0)) throw new Error('Compare-at price must be a positive number.');
  if (!['draft', 'active', 'sold', 'archived'].includes(status)) throw new Error('Invalid status.');
  if (condition && !['new', 'like-new', 'good', 'fair'].includes(condition)) throw new Error('Invalid condition.');
  if (title.length > 200) throw new Error('Title is too long (200 characters max).');
  const specs: Record<string, string> = {};
  for (const k of ['head_size', 'weight', 'grip_size', 'balance', 'year']) {
    const v = (formData.get(`spec_${k}`) as string)?.trim();
    if (v) specs[k] = v;
  }

  const record = {
    title,
    brand: (formData.get('brand') as string)?.trim() || null,
    model: (formData.get('model') as string)?.trim() || null,
    description: (formData.get('description') as string)?.trim() || null,
    category_id: formData.get('category_id') as string,
    price_aed: price,
    compare_at_price: compare,
    condition,
    specs,
    quantity,
    is_unique: formData.get('is_unique') === 'on',
    status,
    images: [...existingImages, ...uploaded],
    source: (formData.get('source') as string) || 'manual',
    ig_post_url: (formData.get('ig_post_url') as string)?.trim() || null,
  };

  if (id) {
    const { error } = await admin.from('products').update(record).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from('products').insert({ ...record, slug: slugify(title) });
    if (error) throw new Error(error.message);
  }

  revalidateStorefront();
  redirect('/admin/products');
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  if (!UUID.test(id)) throw new Error('Invalid product');
  const { error } = await supabaseAdmin().from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidateStorefront();
}

/**
 * Status change through set_order_status() (supabase/UPGRADE-CHECKOUT.sql):
 * cancelling puts the items back in stock exactly once, un-cancelling takes
 * them out again, and a row lock makes double-clicks harmless.
 */
export async function updateOrderStatus(id: string, status: string) {
  await requireAdmin();
  if (!UUID.test(id)) throw new Error('Invalid order');
  if (!['paid', 'fulfilled', 'cancelled'].includes(status)) throw new Error('Invalid status');
  const { error } = await supabaseAdmin().rpc('set_order_status', { p_order: id, p_status: status });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/orders');
  revalidateStorefront();
}
