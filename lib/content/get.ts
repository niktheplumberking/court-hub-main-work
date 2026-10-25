import { supabasePublic } from '@/lib/supabase/public';
import defaults from './defaults.json';
import arDefaults from './defaults.ar.json';
import type { Locale } from '@/lib/i18n/locale';

// v1.2 replaces the model selector with a direct enquiry. Older database
// overrides may still describe the retired form; upgrade only those exact
// default values without overwriting client-authored copy or changing data.
const RETIRED_COPY: Record<string, string[]> = {
  'about.hero.cta_secondary': ['Book a Court', 'احجز ملعبًا'],
  'construct.build_form.eyebrow': ['/// Builder Configurator ///', '/// مُجهّز المواصفات ///'],
  'construct.build_form.heading': ['Configure Your Court', 'جهّز مواصفات ملعبك'],
  'construct.build_form.desc': [
    'Select a court model specs, check key features in real-time, and get a customized instant quote on WhatsApp.',
    'اختر مواصفات الطراز، وراجع الخصائص الأساسية لحظيًا، واحصل على عرض سعر فوري مخصص عبر واتساب.',
  ],
  'construct.build_form.security_caption': ['PROPOSAL DELIVERED SECURELY IN SECONDS', 'يصلك العرض بأمان خلال ثوانٍ'],
};

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
//
// Arabic: defaults.ar.json is a flat key → Arabic value overlay. Resolution
// for locale 'ar' is en defaults → en DB rows → ar defaults → ar DB rows
// (rows keyed `ar:<key>`), i.e. the standard ar → en fallback chain. Image
// fields are deliberately absent from the ar overlay so Arabic pages track
// the live (possibly DB-pinned) English imagery unless an ar row overrides.
// ============================================================================

export type ContentPage = 'home' | 'about' | 'contact' | 'construct' | 'shop' | 'faq' | 'terms' | 'privacy';
export type ContentType = 'text' | 'richtext' | 'image';

export interface ContentField {
  page: ContentPage;
  label: string;
  type: ContentType;
  value: string;
}

export type ContentMap = Record<string, string>;

export const CONTENT_DEFAULTS = defaults as Record<string, ContentField>;
export const AR_CONTENT_DEFAULTS = arDefaults as Record<string, string>;

/** DB key for a field in a given locale ('ar:' prefix keeps EN rows untouched). */
export const dbKeyFor = (locale: Locale, key: string) => (locale === 'ar' ? `ar:${key}` : key);

/**
 * All copy for one page: defaults overlaid with any DB rows. Unknown DB keys
 * are ignored (defaults.json defines the schema); empty values fall back.
 */
export async function getPageContent(page: ContentPage, locale: Locale = 'en'): Promise<ContentMap> {
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
    const arRows: { key: string; value: unknown }[] = [];
    for (const row of data ?? []) {
      if (row.key.startsWith('ar:')) {
        arRows.push(row);
        continue;
      }
      if (row.key in map && typeof row.value === 'string' && row.value.length > 0) {
        map[row.key] = row.value;
      }
    }
    if (locale === 'ar') {
      for (const [key, value] of Object.entries(AR_CONTENT_DEFAULTS)) {
        if (key in map && value.length > 0) map[key] = value;
      }
      for (const row of arRows) {
        const key = row.key.slice(3);
        if (key in map && typeof row.value === 'string' && row.value.length > 0) {
          map[key] = row.value;
        }
      }
    }
  } catch (e) {
    // Missing env (local dev) or DB hiccup — defaults keep the site whole.
    console.error(`[content] ${page} fetch failed — serving defaults`, e);
    if (locale === 'ar') {
      for (const [key, value] of Object.entries(AR_CONTENT_DEFAULTS)) {
        if (key in map && value.length > 0) map[key] = value;
      }
    }
  }
  for (const [key, retired] of Object.entries(RETIRED_COPY)) {
    if (key in map && retired.some((value) => value.toLowerCase() === map[key].trim().toLowerCase())) {
      map[key] = locale === 'ar'
        ? AR_CONTENT_DEFAULTS[key] ?? CONTENT_DEFAULTS[key].value
        : CONTENT_DEFAULTS[key].value;
    }
  }
  return map;
}

/** Single-key convenience (used sparingly; prefer getPageContent per page). */
export async function getContent(key: string, locale: Locale = 'en'): Promise<string> {
  const field = CONTENT_DEFAULTS[key];
  if (!field) return '';
  const map = await getPageContent(field.page, locale);
  return map[key] ?? field.value;
}
