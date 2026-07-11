'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { saveProduct } from '@/lib/actions/products';
import type { Product, Category } from '@/lib/types';

type Parsed = {
  title?: string; brand?: string; model?: string; description?: string;
  price_aed?: number; condition?: string; category_slug?: string;
  head_size?: string; weight?: string; grip_size?: string; balance?: string; year?: string;
};

export default function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const [form, setForm] = useState({
    title: product?.title ?? '',
    brand: product?.brand ?? '',
    model: product?.model ?? '',
    description: product?.description ?? '',
    category_id: product?.category_id ?? categories[0]?.id ?? '',
    price_aed: product?.price_aed?.toString() ?? '',
    compare_at_price: product?.compare_at_price?.toString() ?? '',
    condition: (product?.condition ?? 'good') as string,
    quantity: product?.quantity?.toString() ?? '1',
    is_unique: product?.is_unique ?? true,
    status: (product?.status ?? 'active') as string,
    ig_post_url: product?.ig_post_url ?? '',
    spec_head_size: product?.specs?.head_size ?? '',
    spec_weight: product?.specs?.weight ?? '',
    spec_grip_size: product?.specs?.grip_size ?? '',
    spec_balance: product?.specs?.balance ?? '',
    spec_year: product?.specs?.year ?? '',
  });
  const [existingImages, setExistingImages] = useState<string[]>(product?.images ?? []);
  const [caption, setCaption] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const parseCaption = async () => {
    if (!caption.trim()) return;
    setParsing(true);
    setParseError(null);
    try {
      const res = await fetch('/api/parse-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Parsing failed');
      const p: Parsed = data.parsed;
      const cat = categories.find((c) => c.slug === p.category_slug);
      setForm((f) => ({
        ...f,
        title: p.title ?? f.title,
        brand: p.brand ?? f.brand,
        model: p.model ?? f.model,
        description: p.description ?? f.description,
        price_aed: p.price_aed != null ? String(p.price_aed) : f.price_aed,
        condition: p.condition ?? f.condition,
        category_id: cat?.id ?? f.category_id,
        is_unique: p.condition !== 'new',
        spec_head_size: p.head_size ?? f.spec_head_size,
        spec_weight: p.weight ?? f.spec_weight,
        spec_grip_size: p.grip_size ?? f.spec_grip_size,
        spec_balance: p.balance ?? f.spec_balance,
        spec_year: p.year ?? f.spec_year,
      }));
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Parsing failed');
    } finally {
      setParsing(false);
    }
  };

  const submit = (formData: FormData) => {
    setSaveError(null);
    formData.set('existing_images', JSON.stringify(existingImages));
    if (product?.id) formData.set('id', product.id);
    startTransition(async () => {
      try {
        await saveProduct(formData);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Save failed';
        if (!msg.includes('NEXT_REDIRECT')) setSaveError(msg);
      }
    });
  };

  const labelCls = 'block text-white/40 text-xs uppercase tracking-wider mb-2';

  return (
    <div className="space-y-6">
      {/* ── AI Instagram Import ── */}
      <div className="adm-card p-6 space-y-4 border-court-blue/30 bg-court-blue/10">
        <div className="flex items-center gap-2 text-court-blue">
          <Sparkles size={16} />
          <h2 className="adm-eyebrow text-court-blue!">/// IMPORT FROM INSTAGRAM</h2>
        </div>
        <p className="text-white/40 text-xs">Paste the caption of an @used_rackets post — AI fills the form below. Review, attach the photo, publish.</p>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          placeholder={'e.g. "Babolat Technical Viper 2023 🔥 370g, used one season, great condition. 750 AED. DM to buy"'}
          className="adm-textarea"
        />
        <button type="button" onClick={parseCaption} disabled={parsing || !caption.trim()}
          className="px-5 py-2.5 rounded-full bg-court-blue text-white font-bold text-sm hover:brightness-110 transition disabled:opacity-40">
          {parsing ? 'PARSING…' : '✨ PARSE WITH AI'}
        </button>
        {parseError && <p className="text-fire text-sm">{parseError}</p>}
      </div>

      {/* ── Product form ── */}
      <form action={submit} className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Basics */}
          <div className="adm-card p-6 space-y-5">
            <p className="adm-eyebrow">/// BASICS</p>
            <div>
              <label className={labelCls}>Title *</label>
              <input name="title" required value={form.title} onChange={(e) => set('title', e.target.value)} className="adm-input" placeholder="Babolat Technical Viper 2023" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Brand</label>
                <input name="brand" value={form.brand} onChange={(e) => set('brand', e.target.value)} className="adm-input" placeholder="Babolat" />
              </div>
              <div>
                <label className={labelCls}>Model</label>
                <input name="model" value={form.model} onChange={(e) => set('model', e.target.value)} className="adm-input" placeholder="Technical Viper" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea name="description" rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} className="adm-textarea" />
            </div>
          </div>

          {/* Specs */}
          <div className="adm-card p-6 space-y-5">
            <p className="adm-eyebrow">/// SPECS</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(['head_size', 'weight', 'grip_size', 'balance', 'year'] as const).map((k) => (
                <div key={k}>
                  <label className={labelCls}>{k.replace('_', ' ')}</label>
                  <input name={`spec_${k}`} value={form[`spec_${k}`]} onChange={(e) => set(`spec_${k}`, e.target.value)} className="adm-input" />
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="adm-card p-6 space-y-5">
            <p className="adm-eyebrow">/// IMAGES</p>
            <div>
              {existingImages.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                  {existingImages.map((img) => (
                    <div key={img} className="relative aspect-square rounded-xl border border-white/10 overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setExistingImages((arr) => arr.filter((i) => i !== img))}
                        className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-fire transition-opacity">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input type="file" name="image_files" multiple accept="image/*"
                className="block w-full text-sm text-white/50 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:bg-lime file:text-ink file:font-bold file:text-sm hover:file:brightness-110" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Pricing & status */}
          <div className="adm-card p-6 space-y-5">
            <p className="adm-eyebrow">/// PRICING &amp; STATUS</p>
            <div>
              <label className={labelCls}>Status</label>
              <select name="status" value={form.status} onChange={(e) => set('status', e.target.value)} className="adm-input">
                <option value="active">Active (live in shop)</option>
                <option value="draft">Draft (hidden)</option>
                <option value="sold">Sold</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <select name="category_id" value={form.category_id} onChange={(e) => set('category_id', e.target.value)} className="adm-input">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Condition</label>
              <select name="condition" value={form.condition} onChange={(e) => set('condition', e.target.value)} className="adm-input">
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Price (AED) *</label>
              <input name="price_aed" required type="number" step="0.01" min="0" value={form.price_aed} onChange={(e) => set('price_aed', e.target.value)} className="adm-input" />
            </div>
            <div>
              <label className={labelCls}>Compare-at price (AED)</label>
              <input name="compare_at_price" type="number" step="0.01" min="0" value={form.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)} className="adm-input" />
            </div>
            <div>
              <label className={labelCls}>Quantity</label>
              <input name="quantity" type="number" min="0" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} className="adm-input" disabled={form.is_unique} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="is_unique" checked={form.is_unique}
                onChange={(e) => { set('is_unique', e.target.checked); if (e.target.checked) set('quantity', '1'); }}
                className="w-4 h-4 accent-[#C8FF3D]" />
              <span className="text-white/70 text-sm">Unique item — auto-remove when sold</span>
            </label>
          </div>

          <div className="adm-card p-6">
            <label className={labelCls}>Instagram post URL</label>
            <input name="ig_post_url" value={form.ig_post_url} onChange={(e) => set('ig_post_url', e.target.value)} className="adm-input" placeholder="https://instagram.com/p/…" />
            <input type="hidden" name="source" value={caption ? 'instagram' : (product?.source ?? 'manual')} />
          </div>

          {saveError && <p className="text-fire text-sm">{saveError}</p>}
          <button disabled={pending} className="adm-pulse w-full py-4 rounded-full bg-lime text-ink font-bold tracking-wide hover:brightness-110 transition disabled:opacity-50">
            {pending ? 'SAVING…' : product ? 'SAVE CHANGES' : 'CREATE PRODUCT'}
          </button>
          <Link href="/admin/products"
            className="block w-full py-3.5 rounded-full border border-white/15 text-white/60 font-bold text-sm text-center hover:border-white/40 hover:text-white transition-colors">
            CANCEL
          </Link>
        </div>
      </form>
    </div>
  );
}
