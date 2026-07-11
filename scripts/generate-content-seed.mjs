// Generates supabase/migrations/20260710_site_content_seed.sql from
// lib/content/defaults.json (the single source of truth for content fields).
// Run after changing defaults.json:  node scripts/generate-content-seed.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const defaults = JSON.parse(readFileSync(join(root, 'lib/content/defaults.json'), 'utf8'));

const esc = (s) => String(s).replace(/'/g, "''");

const rows = Object.entries(defaults).map(([key, f]) => {
  const valueJson = JSON.stringify(f.value); // jsonb column holds a JSON string
  return `  ('${esc(key)}', '${esc(valueJson)}'::jsonb, '${esc(f.page)}', '${esc(f.label)}', '${f.type}')`;
});

const sql = `-- ============================================================================
-- Site Content SEED — AUTO-GENERATED from lib/content/defaults.json.
-- Do not edit by hand; regenerate with: node scripts/generate-content-seed.mjs
--
-- Re-runnable: existing rows keep their (possibly client-edited) VALUE and
-- only refresh page/label/type metadata.
-- ============================================================================

insert into site_content (key, value, page, label, type) values
${rows.join(',\n')}
on conflict (key) do update
  set page = excluded.page, label = excluded.label, type = excluded.type;
`;

writeFileSync(join(root, 'supabase/migrations/20260710_site_content_seed.sql'), sql);
console.log(`seed written: ${rows.length} rows`);
