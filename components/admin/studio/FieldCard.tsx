'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  saveContentField,
  resetContentField,
  type ContentActionState,
} from '@/lib/actions/content';
import type { ContentType } from '@/lib/content/get';

const IDLE: ContentActionState = { status: 'idle' };

interface Flash {
  ok: boolean;
  msg: string;
  fading?: boolean;
}

/**
 * One editable field inside the Content Studio. Owns its draft value locally:
 * `baseline` mirrors what is currently SAVED (override ?? shipped default) and
 * the Save button only appears once the draft drifts from it. Saves call the
 * server actions directly (no <form> plumbing) inside a transition, then
 * notify the studio so edited-counts and the live preview stay in sync.
 */
export default function FieldCard({
  fieldKey,
  label,
  type,
  defaultValue,
  savedValue,
  onSaved,
  onReset,
}: {
  fieldKey: string;
  label: string;
  type: ContentType;
  /** Shipped default from defaults.json. */
  defaultValue: string;
  /** Currently saved value (override ?? default) at mount time. */
  savedValue: string;
  /** Fires after a successful save with the new saved value. */
  onSaved: (key: string, value: string) => void;
  /** Fires after a successful reset-to-default. */
  onReset: (key: string) => void;
}) {
  const [value, setValue] = useState(savedValue);
  const [baseline, setBaseline] = useState(savedValue);
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState(savedValue); // image preview src
  const [flash, setFlash] = useState<Flash | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const isImage = type === 'image';
  const dirty = isImage ? file !== null : value !== baseline;
  const edited = baseline !== defaultValue; // saved value differs from shipped default

  function showFlash(ok: boolean, msg: string) {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    setFlash({ ok, msg });
    if (ok) {
      // Success notes fade out, errors stay until the next action.
      timersRef.current.push(
        window.setTimeout(() => setFlash((f) => (f ? { ...f, fading: true } : f)), 2000),
        window.setTimeout(() => setFlash(null), 2600)
      );
    }
  }

  function handleFilePick(picked: File | null) {
    setFile(picked);
    setThumb(picked ? URL.createObjectURL(picked) : baseline);
  }

  function handleSave() {
    if (!dirty || pending) return;
    const fd = new FormData();
    fd.append('key', fieldKey);
    if (isImage) {
      if (!file) return;
      fd.append('image_file', file);
    } else {
      fd.append('value', value);
    }
    startTransition(async () => {
      const res = await saveContentField(IDLE, fd);
      if (res.status === 'saved') {
        // For images the stored URL isn't returned; the local object URL keeps
        // the thumb (and edited-detection) accurate until the next full load.
        const next = isImage ? thumb : value.trim();
        if (!isImage) setValue(next);
        setBaseline(next);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onSaved(fieldKey, next);
        showFlash(true, 'Live on the site ✓');
      } else {
        showFlash(false, res.message ?? 'Save failed.');
      }
    });
  }

  function handleReset() {
    if (pending) return;
    const fd = new FormData();
    fd.append('key', fieldKey);
    startTransition(async () => {
      const res = await resetContentField(IDLE, fd);
      if (res.status === 'reset') {
        setValue(defaultValue);
        setBaseline(defaultValue);
        setThumb(defaultValue);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onReset(fieldKey);
        showFlash(true, 'Back to the original ✓');
      } else {
        showFlash(false, res.message ?? 'Reset failed.');
      }
    });
  }

  const textareaRows = Math.min(
    8,
    Math.max(2, value.split('\n').length, Math.ceil(value.length / 80))
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={`field-${fieldKey}`}
          className="text-[13px] font-semibold text-white/80 leading-snug"
        >
          {label}
          {edited && (
            <span className="ml-2 align-middle text-[9px] font-mono uppercase tracking-widest text-lime/80 border border-lime/25 rounded-full px-2 py-0.5">
              edited
            </span>
          )}
        </label>
        {edited && (
          <button
            type="button"
            onClick={handleReset}
            disabled={pending}
            title="Remove the edit and show the original again"
            className="shrink-0 inline-flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime rounded-sm"
          >
            <RotateCcw className="w-3 h-3" aria-hidden />
            Reset to original
          </button>
        )}
      </div>

      {isImage ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt={`Current image for ${label}`}
            className="aspect-video w-full max-w-[284px] max-h-40 rounded-xl border border-white/10 object-cover bg-ink-2"
          />
          <input
            ref={fileInputRef}
            id={`field-${fieldKey}`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-white/60 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white/20 file:cursor-pointer"
          />
          <p className="text-[11px] text-white/30">jpg / png / webp, up to 8MB</p>
        </div>
      ) : type === 'richtext' ? (
        <textarea
          id={`field-${fieldKey}`}
          value={value}
          rows={textareaRows}
          onChange={(e) => setValue(e.target.value)}
          className="adm-textarea resize-y"
        />
      ) : (
        <input
          id={`field-${fieldKey}`}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="adm-input"
        />
      )}

      <div className="flex min-h-9 flex-wrap items-center gap-3">
        {dirty && (
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="adm-pulse bg-lime text-ink rounded-full text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-white transition-colors disabled:opacity-60 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
          >
            {pending ? 'Saving…' : isImage ? 'Upload & Save' : 'Save'}
          </button>
        )}
        {flash && (
          <span
            role="status"
            className={`text-xs transition-opacity duration-500 ${
              flash.ok ? 'text-lime' : 'text-fire'
            } ${flash.fading ? 'opacity-0' : 'opacity-100'}`}
          >
            {flash.msg}
          </span>
        )}
      </div>
    </div>
  );
}
