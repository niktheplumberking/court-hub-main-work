import type { Product } from '@/lib/types';
import Footer from '@/components/home/Footer';
import SimpleNav from './SimpleNav';
import SimpleHero from './SimpleHero';
import BrandRibbon from './BrandRibbon';
import NumbersStrip from './NumbersStrip';
import ServicesGrid from './ServicesGrid';
import TopSellersRail from './TopSellersRail';
import ConstructPanel from './ConstructPanel';
import AboutTeaser from './AboutTeaser';

/**
 * Simplified single-scroll homepage (feat/simplified-home). Replaces the
 * scroll-jacked HomeClient: no pinned sections, no frame sequences, no
 * Lenis — CSS transitions + IntersectionObserver reveals only. The old
 * HomeClient stays in the repo unused for easy rollback.
 */
export default function SimplifiedHome({ products }: { products: Product[] }) {
  return (
    <div className="ch-home min-h-screen overflow-x-clip bg-sand text-ink">
      <SimpleNav />
      <SimpleHero />
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
  );
}
