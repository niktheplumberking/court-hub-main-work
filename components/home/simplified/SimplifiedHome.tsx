import type { Product } from '@/lib/types';
import type { ContentMap } from '@/lib/content/get';
import type { Locale } from '@/lib/i18n/locale';
import Footer from '@/components/home/Footer';
import HomeHero from './HomeHero';
import BrandRibbon from './BrandRibbon';
import NumbersStrip from './NumbersStrip';
import ServicesGrid from './ServicesGrid';
import TopSellersRail from './TopSellersRail';
import ConstructPanel from './ConstructPanel';
import AboutTeaser from './AboutTeaser';

/**
 * Simplified single-scroll homepage. Opens with the same framed mock-up hero
 * as the swipe pages (HomeHero) but IN-FLOW — home scrolls normally, no
 * blanket-over-hero effect. Lives inside the (swipe) route group, so the
 * global <Header /> (mobile bar + sideways rail) comes from the layout.
 * The sideways rail floats OVER content as a translucent overlay — no
 * reserved lane (the visible left stripe read as a layout bug to the client).
 */
export default function SimplifiedHome({
  products,
  content,
  locale = 'en',
}: {
  products: Product[];
  content: ContentMap;
  locale?: Locale;
}) {
  return (
    <div className="ch-home ch-has-rail min-h-screen bg-ink text-ink">
      <HomeHero content={content} />
      <div className="relative overflow-x-clip bg-sand">
        <BrandRibbon locale={locale} />
        <NumbersStrip content={content} />
        <ServicesGrid content={content} locale={locale} />
        <TopSellersRail products={products} content={content} />
        <ConstructPanel content={content} locale={locale} />
        <AboutTeaser content={content} locale={locale} />
        <div className="ch-on-dark">
          <Footer />
        </div>
      </div>
    </div>
  );
}
