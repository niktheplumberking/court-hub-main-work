'use client';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Plus, Trash2 } from 'lucide-react';
import {
  createCategory,
  deleteCategory,
  type CategoryActionState,
} from '@/lib/actions/categories';
import type { Category } from '@/lib/types';

const IDLE: CategoryActionState = { status: 'idle' };

type Row = Category & { productCount: number };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 inline-flex items-center gap-2 bg-lime text-ink font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-white transition-colors disabled:opacity-50 cursor-pointer adm-pulse"
    >
      <Plus className="w-4 h-4" />
      {pending ? 'Adding…' : 'Add category'}
    </button>
  );
}

function DeleteButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      title={disabled ? 'This category still has products' : 'Delete category'}
      className="shrink-0 inline-flex items-center gap-1.5 text-xs text-white/45 border border-white/15 rounded-full px-3.5 py-1.5 hover:border-fire hover:text-fire transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {pending ? 'Removing…' : 'Delete'}
    </button>
  );
}

function CategoryRow({ cat }: { cat: Row }) {
  const [state, action] = useActionState(deleteCategory, IDLE);
  return (
    <div className="adm-card px-4 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white/90 truncate">{cat.name}</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/35">
          {cat.slug} · {cat.productCount} product{cat.productCount === 1 ? '' : 's'}
        </p>
        {state.status === 'error' && <p className="text-fire text-xs mt-1">{state.message}</p>}
      </div>
      <form action={action}>
        <input type="hidden" name="id" value={cat.id} />
        <DeleteButton disabled={cat.productCount > 0} />
      </form>
    </div>
  );
}

export default function CategoryManager({ categories }: { categories: Row[] }) {
  const [addState, addAction] = useActionState(createCategory, IDLE);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the input after a successful add (the row list refreshes via revalidate).
  useEffect(() => {
    if (addState.status === 'ok') formRef.current?.reset();
  }, [addState]);

  return (
    <div className="space-y-6 adm-fade-up" style={{ '--adm-delay': '0.06s' } as React.CSSProperties}>
      {/* Add form */}
      <form ref={formRef} action={addAction} className="adm-card p-5 space-y-3">
        <p className="adm-eyebrow">/// Add a category</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            name="name"
            required
            maxLength={60}
            placeholder="e.g. Balls, Bags, Apparel…"
            className="adm-input flex-1"
          />
          <AddButton />
        </div>
        {addState.status === 'ok' && <p className="text-lime text-xs">{addState.message}</p>}
        {addState.status === 'error' && <p className="text-fire text-xs">{addState.message}</p>}
      </form>

      {/* Existing categories */}
      <div className="space-y-3">
        <p className="adm-eyebrow">/// {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</p>
        {categories.length === 0 ? (
          <p className="text-white/40 text-sm">No categories yet — add your first one above.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((c) => (
              <CategoryRow key={c.id} cat={c} />
            ))}
          </div>
        )}
        <p className="text-white/30 text-xs pt-1">
          A category can only be deleted once no products use it.
        </p>
      </div>
    </div>
  );
}
