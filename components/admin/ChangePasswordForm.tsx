'use client';
import { useActionState } from 'react';
import { changeOwnPassword } from '@/lib/actions/account';

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-white/40 text-xs uppercase tracking-wider mb-2">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="adm-input"
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-white/40 text-xs uppercase tracking-wider mb-2">
          Repeat new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="adm-input"
          placeholder="Type it again"
        />
      </div>

      {state && (
        <p className={`text-sm ${state.ok ? 'text-green' : 'text-fire'}`}>{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="px-6 py-3 rounded-full bg-lime text-ink font-bold text-sm hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
      >
        {pending ? 'Saving…' : 'Change password'}
      </button>
    </form>
  );
}
