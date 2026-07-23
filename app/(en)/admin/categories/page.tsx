import { supabaseServer } from '@/lib/supabase/server';
import CategoryManager from '@/components/admin/CategoryManager';
import type { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminCategories() {
  let categories: (Category & { productCount: number })[] = [];
  try {
    const supabase = await supabaseServer();
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('sort'),
      supabase.from('products').select('category_id'),
    ]);
    const counts = new Map<string, number>();
    for (const p of (prods ?? []) as { category_id: string }[]) {
      counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
    }
    categories = ((cats ?? []) as Category[]).map((c) => ({
      ...c,
      productCount: counts.get(c.id) ?? 0,
    }));
  } catch (e) {
    console.error('[admin/categories] load failed', e);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 adm-fade-up">
        <p className="adm-eyebrow">/// Inventory deck</p>
        <h1 className="font-display font-black uppercase italic text-3xl md:text-4xl text-white tracking-tight">
          Product <span className="text-lime">categories</span>
        </h1>
        <p className="text-white/50 text-sm max-w-xl">
          Add or remove the categories your products can belong to. New
          categories appear in the product form&apos;s dropdown right away.
        </p>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
