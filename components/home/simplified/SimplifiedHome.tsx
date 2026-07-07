import type { Product } from '@/lib/types';
import Footer from '@/components/home/Footer';
import Header from '@/components/home/Header';
import HomeHero from './HomeHero';
import BrandRibbon from './BrandRibbon';
import NumbersStrip from './NumbersStrip';
import ServicesGrid from './ServicesGrid';
import TopSellersRail from './TopSellersRail';
import ConstructPanel from './ConstructPanel';
import AboutTeaser from './AboutTeaser';

/**
 * Simplified single-scroll homepage. Opens with the SAME framed mock-up hero
 * as the swipe pages (fixed night-courts panel + in-frame navbar via
 * HomeHero); the sections below scroll over it as a blanket. Global <Header />
 * supplies the mobile top bar and the sideways rail once the hero scrolls out.
 */
export default function SimplifiedHome({ products }: { products: Product[] }) {
  return (
    <div className="ch-home min-h-screen bg-ink text-ink">
      <Header />
      <HomeHero />
      <div className="relative z-10 overflow-x-clip bg-sand shadow-[0_-24px_50px_rgba(0,0,0,0.6)]">
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
