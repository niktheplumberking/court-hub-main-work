'use client';
import { Trash2 } from 'lucide-react';
import { deleteProduct } from '@/lib/actions/products';

export default function DeleteProductButton({ id }: { id: string }) {
  return (
    <button
      onClick={async () => {
        if (confirm('Delete this product permanently?')) await deleteProduct(id);
      }}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/15 text-white/30 hover:border-fire hover:text-fire transition-colors"
      title="Delete"
    >
      <Trash2 size={15} />
    </button>
  );
}
