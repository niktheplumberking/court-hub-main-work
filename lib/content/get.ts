import { supabasePublic } from '@/lib/supabase/public';
import defaults from './defaults.json';

// ============================================================================
// Site Content — client-editable copy.
//
// lib/content/defaults.json is the single source of truth for WHICH fields
// exist and their original values (extracted verbatim from the pages). The
// site_content table only ever OVERRIDES those defaults, so:
//   • with an empty/unreachable DB the site renders byte-identical to before,
//   • a new deploy can add fields without a migration racing it,
//   • the seed SQL is generated from the same file
//     (node scripts/generate-content-seed.mjs).
//
// Pages fetch server-side with ISR (`export const revalidate`) and the admin
// save action calls revalidatePath() — edits go live without a redeploy on
// any Node host (plain `next start` on a VPS included; nothing Vercel-only).
// ============================================================================

export type ContentPage = 'home' | 'about' | 'contact' | 'construct' | 'shop' | 'faq';
export type ContentType = 'text' | 'richtext' | 'image';

export interface ContentField {
  page: ContentPage;
  label: string;
  type: ContentType;
  value: string;
}

export type ContentMap = Record<string, string>;

export const CONTENT_DEFAULTS = defaults as Record<string, ContentField>;

/**
 * All copy for one page: defaults overlaid with any DB rows. Unknown DB keys
 * are ignored (defaults.json defines the schema); empty values fall back.
 */
export async function getPageContent(page: ContentPage): Promise<ContentMap> {
  const map: ContentMap = {};
  for (const [key, field] of Object.entries(CONTENT_DEFAULTS)) {
    if (field.page === page) map[key] = field.value;
  }
  try {
    const { data, error } = await supabasePublic()
      .from('site_content')
      .select('key,value')
      .eq('page', page);
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.key in map && typeof row.value === 'string' && row.value.length > 0) {
        map[row.key] = row.value;
      }
    }
  } catch (e) {
    // Missing env (local dev) or DB hiccup — defaults keep the site whole.
    console.error(`[content] ${page} fetch failed — serving defaults`, e);
  }
  return map;
}

/** Single-key convenience (used sparingly; prefer getPageContent per page). */
export async function getContent(key: string): Promise<string> {
  const field = CONTENT_DEFAULTS[key];
  if (!field) return '';
  const map = await getPageContent(field.page);
  return map[key] ?? field.value;
}
