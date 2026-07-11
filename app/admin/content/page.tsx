import { supabaseServer } from '@/lib/supabase/server';
import ContentStudio from '@/components/admin/studio/ContentStudio';

export const dynamic = 'force-dynamic';

export default async function AdminContent() {
  // Current overrides (public-read RLS; middleware already gates /admin).
  // Fails soft to defaults-only when the DB is unreachable (e.g. local dev
  // without Supabase env) — same philosophy as getPageContent().
  const overrides: Record<string, string> = {};
  try {
    const supabase = await supabaseServer();
    const { data: rows } = await supabase.from('site_content').select('key,value');
    for (const row of rows ?? []) {
      if (typeof row.value === 'string') overrides[row.key] = row.value;
    }
  } catch (e) {
    console.error('[admin/content] override fetch failed — showing defaults', e);
  }

  return <ContentStudio overrides={overrides} />;
}
