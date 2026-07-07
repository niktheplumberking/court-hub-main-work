import type { Product } from '@/lib/types';
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
 * Content below the hero is padded left on md+ so the rail never covers it.
 */
export default function SimplifiedHome({ products }: { products: Product[] }) {
  return (
    <div className="ch-home min-h-screen bg-ink text-ink">
      <HomeHero />
      <div className="relative overflow-x-clip bg-sand md:pl-24">
        <BrandRibbon />
        <NumbersStrip />
        <ServicesGrid />
        <TopSellersRail products={products} />
        <ConstructPanel />
        <AboutTeaser />
        <div className="ch-on-dark">
          <Footer />
        </div>
      </div>
    </div>
  );
}
