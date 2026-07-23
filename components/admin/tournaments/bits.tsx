'use client';
// Small client helpers shared by the admin tournaments editors. The editors
// themselves are server-rendered uncontrolled forms posting to server actions;
// these bits add the pending label, confirm dialogs and status selects.
import { useFormStatus } from 'react-dom';
import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import type { RegistrationStatus } from '@/lib/tournaments/admin-types';
import { updateRegistrationStatus } from '@/lib/actions/tournaments';

/** Submit button that shows a pending label while its form action runs. */
export function AdminSubmit({
  label,
  pendingLabel = 'Saving…',
  className = 'px-5 py-2.5 rounded-full bg-lime text-ink font-bold text-sm disabled:opacity-50',
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}

/** Native-confirm delete button wrapping a bound server action. */
export function ConfirmButton({
  action,
  message,
  label,
  icon = false,
}: {
  action: () => Promise<void>;
  message: string;
  label?: string;
  icon?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(message)) return;
        startTransition(async () => {
          await action();
        });
      }}
      className={
        icon
          ? 'text-white/20 hover:text-fire transition-colors disabled:opacity-40'
          : 'px-4 py-2 rounded-full border border-white/10 text-white/50 hover:text-fire hover:border-fire/40 text-xs font-bold disabled:opacity-40'
      }
      aria-label={label ?? 'Delete'}
      title={label ?? 'Delete'}
    >
      {icon ? <Trash2 className="w-4 h-4" /> : (label ?? 'Delete')}
    </button>
  );
}

/** Payment status select for a registration row. */
export function RegStatusSelect({ id, status }: { id: string; status: RegistrationStatus }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          await updateRegistrationStatus(id, e.target.value as RegistrationStatus);
        })
      }
      className="bg-ink border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-lime outline-none disabled:opacity-50"
    >
      {(['demo', 'pending', 'paid', 'cancelled'] as RegistrationStatus[]).map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
