import { cleanText } from '@/lib/copy';

export type HeroRacket = { src: string; brand: string; name: string; href: string };
export const HERO_MODELS = [
  { slug: 'ea10-ventus-attack-12k-xtrem-by-edu-alonso-ui2c0', src: '/models/racket-ea10-ventus-attack.glb', name: 'EA10 Ventus Attack 12K' },
  { slug: 'ea10-ventus-hybrid-12k-xtrem-by-edu-alonso-0gsjw', src: '/models/racket-ea10-ventus-hybrid.glb', name: 'EA10 Ventus Hybrid 12K' },
  { slug: 'at10-genius-attack-18k-alum-by-agustin-tapia-a8kmy', src: '/models/racket-at10-genius-attack.glb', name: 'AT10 Genius Attack 18K' },
];

type HeroProduct = { slug: string; status: string; title: string; brand: string | null };

/** Curated 3D assets are advertised only while their actual product is active. */
export function visibleHeroRackets(products: HeroProduct[]): HeroRacket[] {
  return HERO_MODELS.flatMap((model) => {
    const product = products.find((p) => p.slug === model.slug && p.status === 'active');
    return product ? [{ src: model.src, href: `/shop/${product.slug}`, name: model.name, brand: cleanText(product.brand ?? '') }] : [];
  });
}
