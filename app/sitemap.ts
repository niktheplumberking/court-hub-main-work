import type { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005';

// Every core page exists in English and Arabic (/ar prefix) — both are listed
// so the Arabic tree is discoverable; per-page hreflang alternates live in the
// page metadata.
const CORE_PATHS: { path: string; changeFrequency: 'weekly' | 'daily' | 'monthly'; priority: number }[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/shop', changeFrequency: 'daily', priority: 0.9 },
  { path: '/construct-your-court', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/tournaments', changeFrequency: 'daily', priority: 0.8 },
  { path: '/leaderboards', changeFrequency: 'daily', priority: 0.6 },
];

const STATIC_ROUTES: MetadataRoute.Sitemap = CORE_PATHS.flatMap(({ path, ...rest }) => [
  { url: `${SITE_URL}${path}`, ...rest },
  { url: `${SITE_URL}${path === '/' ? '/ar' : `/ar${path}`}`, ...rest },
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('products')
      .select('slug, created_at')
      .eq('status', 'active');

    if (error || !data) return STATIC_ROUTES;

    const productRoutes: MetadataRoute.Sitemap = data.map((p) => ({
      url: `${SITE_URL}/shop/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...STATIC_ROUTES, ...productRoutes];
  } catch {
    // Missing Supabase env locally (or any runtime failure) — degrade
    // gracefully to the static routes instead of breaking the build.
    return STATIC_ROUTES;
  }
}
