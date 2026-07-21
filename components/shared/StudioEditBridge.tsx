'use client';
import { useEffect } from 'react';

/**
 * Click-to-edit bridge (site side). Renders nothing and does nothing on the
 * normal site. Activates ONLY when the page is loaded inside the Content
 * Studio's preview iframe (?cmsedit=1 + framed): it highlights editable
 * sections on hover and, on click, tells the studio which section to open —
 * instead of navigating. Editable regions are marked with `data-cms="page:section"`.
 */
export default function StudioEditBridge() {
  useEffect(() => {
    // Only inside an iframe, and only when the edit flag is present.
    const inFrame = window.self !== window.top;
    const editMode = new URLSearchParams(window.location.search).has('cmsedit');
    if (!inFrame || !editMode) return;

    const style = document.createElement('style');
    style.setAttribute('data-cms-style', '');
    style.textContent = `
      [data-cms]{cursor:pointer;transition:outline-color .15s ease;}
      [data-cms]:hover{outline:2px dashed rgba(200,255,61,.9);outline-offset:3px;border-radius:4px;}
      [data-cms]::after{
        content:"✎ Edit";position:absolute;z-index:2147483000;
        top:6px;left:6px;padding:2px 8px;border-radius:999px;
        background:#C8FF3D;color:#0E0E0C;font:700 10px/1.4 ui-monospace,monospace;
        letter-spacing:.08em;text-transform:uppercase;opacity:0;transition:opacity .15s ease;
        pointer-events:none;
      }
      [data-cms]{position:relative;}
      [data-cms]:hover::after{opacity:1;}
    `;
    document.head.appendChild(style);

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.('[data-cms]') as HTMLElement | null;
      if (!el) return;
      const raw = el.getAttribute('data-cms') || '';
      const [page, section] = raw.split(':');
      if (!page || !section) return;
      // In edit mode a click SELECTS the section — never navigates.
      e.preventDefault();
      e.stopPropagation();
      window.parent.postMessage(
        { source: 'courthub-cms', type: 'cms-edit', page, section },
        window.location.origin
      );
    };
    // Capture phase so we beat Link/anchor navigation handlers.
    document.addEventListener('click', onClick, true);

    return () => {
      document.removeEventListener('click', onClick, true);
      style.remove();
    };
  }, []);

  return null;
}
