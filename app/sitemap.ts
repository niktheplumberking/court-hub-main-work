import type { MetadataRoute } from 'next';
import { supabasePublic } from '@/lib/supabase/public';
import { tournamentsArePublic } from '@/lib/tournaments/flags';
import { SITE_URL, languageAlternates } from '@/lib/seo';

export const revalidate = 300;

// Every core page exists in English and Arabic (/ar prefix) — both are listed
// so the Arabic tree is discoverable; per-page hreflang alternates live in the
// page metadata.
const CORE_PATHS: { path: string; changeFrequency: 'weekly' | 'daily' | 'monthly'; priority: number }[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/shop', changeFrequency: 'daily', priority: 0.9 },
  { path: '/construct-your-court', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
  // Listed only once the section is public (lib/tournaments/flags.ts) — no
  // point sending Google to a Coming Soon screen.
  ...(tournamentsArePublic()
    ? ([
        { path: '/tournaments', changeFrequency: 'daily' as const, priority: 0.8 },
        { path: '/leaderboards', changeFrequency: 'daily' as const, priority: 0.6 },
      ])
    : []),
];

const STATIC_ROUTES: MetadataRoute.Sitemap = CORE_PATHS.flatMap(({ path, ...rest }) => [
  { url: `${SITE_URL}${path}`, ...rest, alternates: { languages: languageAlternates(path) } },
  { url: `${SITE_URL}${path === '/' ? '/ar' : `/ar${path}`}`, ...rest, alternates: { languages: languageAlternates(path) } },
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data, error } = await supabasePublic()
      .from('products')
      .select('slug, created_at')
      .eq('status', 'active');

    if (error || !data) return STATIC_ROUTES;

    const productRoutes: MetadataRoute.Sitemap = data.flatMap((p) => {
      const path = `/shop/${p.slug}`;
      return [path, `/ar${path}`].map((localizedPath) => ({
        url: `${SITE_URL}${localizedPath}`,
        // created_at is not an edit timestamp. Do not claim a false lastModified.
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        alternates: { languages: languageAlternates(path) },
      }));
    });

    return [...STATIC_ROUTES, ...productRoutes];
  } catch {
    // Missing Supabase env locally (or any runtime failure) — degrade
    // gracefully to the static routes instead of breaking the build.
    return STATIC_ROUTES;
  }
}
