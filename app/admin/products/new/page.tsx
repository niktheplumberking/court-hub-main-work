import { supabaseServer } from '@/lib/supabase/server';
import ProductForm from '@/components/admin/ProductForm';
import type { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function NewProduct() {
  const supabase = await supabaseServer();
  const { data: categories } = await supabase.from('categories').select('*').order('sort');
  return (
    <div className="adm-grid-bg space-y-8">
      <div className="space-y-2 adm-fade-up">
        <p className="adm-eyebrow">/// INVENTORY DECK</p>
        <h1 className="font-display font-black uppercase italic text-3xl md:text-4xl text-white tracking-tight">
          NEW <span className="text-lime">WEAPON</span>
        </h1>
      </div>
      <div className="adm-fade-up" style={{ '--adm-delay': '0.06s' } as React.CSSProperties}>
        <ProductForm categories={(categories ?? []) as Category[]} />
      </div>
    </div>
  );
}
