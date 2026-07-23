'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { slugify } from '@/lib/utils';

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
  if (error || !data) throw new Error('Unauthorized — account is not enrolled in the admins list.');
  return user;
}

export async function saveProduct(formData: FormData) {
  await requireAdmin();
  const admin = supabaseAdmin();

  const id = (formData.get('id') as string) || null;
  const title = (formData.get('title') as string)?.trim();
  if (!title) throw new Error('Title is required');

  // Upload any new images to Supabase Storage
  const files = formData.getAll('image_files') as File[];
  const uploaded: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await admin.storage.from('products').upload(path, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const { data } = admin.storage.from('products').getPublicUrl(path);
    uploaded.push(data.publicUrl);
  }

  const existingImages = JSON.parse((formData.get('existing_images') as string) || '[]');
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
    price_aed: Number(formData.get('price_aed') || 0),
    compare_at_price: formData.get('compare_at_price') ? Number(formData.get('compare_at_price')) : null,
    condition: (formData.get('condition') as string) || null,
    specs,
    quantity: Number(formData.get('quantity') || 1),
    is_unique: formData.get('is_unique') === 'on',
    status: (formData.get('status') as string) || 'draft',
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

  revalidatePath('/shop');
  revalidatePath('/admin/products');
  redirect('/admin/products');
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin().from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/shop');
  revalidatePath('/admin/products');
}

export async function updateOrderStatus(id: string, status: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin().from('orders').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/orders');
}
