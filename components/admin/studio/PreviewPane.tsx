'use client';
import { useState } from 'react';
import { EyeOff, Monitor, RefreshCw, Smartphone } from 'lucide-react';
import type { StudioPage } from '@/lib/content/sections';

/**
 * Live preview of the page being edited: the real site in an iframe, dressed
 * as a tiny browser. Remounts (fresh load) whenever `reloadKey` bumps — the
 * studio increments it after every successful save/reset — and when the page
 * or the open section's anchor changes.
 */
export default function PreviewPane({
  page,
  anchor,
  reloadKey,
}: {
  page: StudioPage;
  /** Element id on the live page to scroll to (from the open section). */
  anchor?: string;
  /** Bump to force a fresh iframe load. */
  reloadKey: number;
}) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [manualRefresh, setManualRefresh] = useState(0);

  const src = page.path ? `${page.path}${anchor ? `#${anchor}` : ''}` : null;
  const frameKey = `${page.page}|${anchor ?? ''}|${reloadKey}|${manualRefresh}`;

  return (
    <div className="sticky top-24 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Preview device"
          className="inline-flex rounded-full border border-white/15 p-0.5"
        >
          {(
            [
              { id: 'desktop', label: 'Desktop', Icon: Monitor },
              { id: 'mobile', label: 'Mobile', Icon: Smartphone },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={device === id}
              onClick={() => setDevice(id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime ${
                device === id
                  ? 'bg-lime text-ink font-bold'
                  : 'text-white/50 hover:text-lime'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setManualRefresh((n) => n + 1)}
          disabled={!src}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest text-white/50 hover:text-lime hover:border-lime/40 transition-colors disabled:opacity-40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden />
          Refresh
        </button>
      </div>

      {src ? (
        <div className="adm-card overflow-hidden">
          {/* Fake browser chrome */}
          <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <i className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <i className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <i className="w-2.5 h-2.5 rounded-full bg-lime/50" />
            </span>
            <span className="flex-1 truncate rounded-full bg-white/5 px-3.5 py-1 text-[11px] font-mono text-white/40">
              {src}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-lime/70">
              <span className="adm-live-dot" aria-hidden />
              live
            </span>
          </div>
          <div className={device === 'mobile' ? 'flex justify-center bg-ink-2/60 py-4' : ''}>
            <iframe
              key={frameKey}
              src={src}
              title={`Live preview of the ${page.title} page`}
              className={
                device === 'mobile'
                  ? 'w-[390px] max-w-full h-[70vh] rounded-xl border border-white/10 bg-ink'
                  : 'block w-full h-[70vh] bg-ink'
              }
            />
          </div>
        </div>
      ) : (
        <div className="adm-card p-6 space-y-3">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <EyeOff className="w-4 h-4 text-white/50" aria-hidden />
          </span>
          <p className="font-display text-sm font-extrabold uppercase text-white">
            Nothing to preview — yet
          </p>
          <p className="text-xs text-white/45 leading-relaxed">
            The {page.title} section isn&apos;t currently shown anywhere on the
            site, so there&apos;s no page to preview. Your edits are still saved
            and will appear automatically the moment it returns.
          </p>
        </div>
      )}

      <p className="text-xs text-white/35">
        This is the real live site — it updates moments after you save.
      </p>
    </div>
  );
}
