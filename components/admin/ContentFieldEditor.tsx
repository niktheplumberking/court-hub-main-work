'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  saveContentField,
  resetContentField,
  type ContentActionState,
} from '@/lib/actions/content';
import type { ContentType } from '@/lib/content/get';

const IDLE: ContentActionState = { status: 'idle' };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-lime text-ink text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
    >
      {pending ? 'Saving…' : label}
    </button>
  );
}

function ResetButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-white/40 hover:text-white underline underline-offset-2 disabled:opacity-50 cursor-pointer"
      title="Remove the override and show the original text again"
    >
      {pending ? 'Resetting…' : 'Reset to default'}
    </button>
  );
}

function Status({ state }: { state: ContentActionState }) {
  if (state.status === 'saved') return <span className="text-xs text-lime">Saved — live on the site.</span>;
  if (state.status === 'reset') return <span className="text-xs text-lime">Reset to the original text.</span>;
  if (state.status === 'error') return <span className="text-xs text-red-400">{state.message}</span>;
  return null;
}

/**
 * One editable content field: text input / textarea / image upload depending
 * on type. `overridden` marks fields whose value differs from the shipped
 * default (i.e. a site_content row exists).
 */
export default function ContentFieldEditor({
  fieldKey,
  label,
  type,
  value,
  overridden,
}: {
  fieldKey: string;
  label: string;
  type: ContentType;
  value: string;
  overridden: boolean;
}) {
  const [saveState, saveAction] = useActionState(saveContentField, IDLE);
  const [resetState, resetAction] = useActionState(resetContentField, IDLE);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-white/80">
          {label}
          {overridden && (
            <span className="ml-2 text-[9px] font-mono uppercase tracking-widest text-lime/80 border border-lime/25 rounded-full px-2 py-0.5">
              edited
            </span>
          )}
        </p>
        {overridden && (
          <form action={resetAction} className="flex items-center gap-3">
            {/* Reset feedback lives here so a later reset can't show a stale
                "Saved" from the save form (and vice versa). */}
            <Status state={resetState} />
            <input type="hidden" name="key" value={fieldKey} />
            <ResetButton />
          </form>
        )}
      </div>

      <form action={saveAction} className="space-y-3">
        <input type="hidden" name="key" value={fieldKey} />

        {type === 'image' ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="h-24 w-40 rounded-xl object-cover border border-white/10 bg-ink-2"
            />
            <input
              type="file"
              name="image_file"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-xs text-white/60 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white/20 file:cursor-pointer"
            />
          </div>
        ) : type === 'richtext' ? (
          <textarea
            name="value"
            defaultValue={value}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-ink-2 px-3.5 py-2.5 text-sm text-white/90 focus:border-lime/50 focus:outline-none"
          />
        ) : (
          <input
            type="text"
            name="value"
            defaultValue={value}
            className="w-full rounded-xl border border-white/10 bg-ink-2 px-3.5 py-2.5 text-sm text-white/90 focus:border-lime/50 focus:outline-none"
          />
        )}

        <div className="flex items-center gap-4">
          <SubmitButton label={type === 'image' ? 'Upload & Save' : 'Save'} />
          <Status state={saveState} />
        </div>
      </form>
    </div>
  );
}
