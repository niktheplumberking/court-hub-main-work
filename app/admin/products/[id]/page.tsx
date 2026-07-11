import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import ProductForm from '@/components/admin/ProductForm';
import type { Category, Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('categories').select('*').order('sort'),
  ]);
  if (!product) notFound();
  return (
    <div className="adm-grid-bg space-y-8">
      <div className="space-y-2 adm-fade-up">
        <p className="adm-eyebrow">/// INVENTORY DECK</p>
        <h1 className="font-display font-black uppercase italic text-3xl md:text-4xl text-white tracking-tight">
          TUNE THE <span className="text-lime">GEAR</span>
        </h1>
      </div>
      <div className="adm-fade-up" style={{ '--adm-delay': '0.06s' } as React.CSSProperties}>
        <ProductForm product={product as Product} categories={(categories ?? []) as Category[]} />
      </div>
    </div>
  );
}
