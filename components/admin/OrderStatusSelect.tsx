'use client';
import { useTransition } from 'react';
import { updateOrderStatus } from '@/lib/actions/products';

const CANCEL_CONFIRM =
  'Cancel this order?\n\nIts items go back in stock automatically.\nRemember to refund the customer in Stripe (Payments → this payment → Refund).';

export default function OrderStatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      aria-label="Order status"
      onChange={(e) => {
        const next = e.target.value;
        if (next === 'cancelled' && !window.confirm(CANCEL_CONFIRM)) {
          e.target.value = status;
          return;
        }
        start(() => updateOrderStatus(id, next));
      }}
      className="adm-input w-auto! rounded-full! px-4! py-2! text-sm cursor-pointer disabled:opacity-50"
    >
      <option value="paid">To ship (paid)</option>
      <option value="fulfilled">Shipped</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}
