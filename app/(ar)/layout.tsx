import type { Metadata } from 'next';
import '../globals.css';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import { CartProvider } from '@/lib/cart-context';
import { TournamentStoreProvider } from '@/lib/tournaments/store';
import CartDrawer from '@/components/cart/CartDrawer';
import MotionProvider from '@/components/shared/MotionProvider';
import Cursor from '@/components/shared/Cursor';
import NavigationFlag from '@/components/shared/NavigationFlag';
import StudioEditBridge from '@/components/shared/StudioEditBridge';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005';

// Arabic root layout — the second root layout (route-group pattern). dir/lang
// land on <html> server-side so RTL is correct on first paint and portals
// (drawers, toasts) inherit it. Fonts swap via html[lang="ar"] overrides of
// the @theme font variables in globals.css.
const META_DESCRIPTION =
  'مجموعة Court Hub: متجر فاخر لمعدات البادل، وإنشاء الملاعب، وموطن البادل في الإمارات.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Court Hub — متجر البادل الفاخر وإنشاء الملاعب في الإمارات',
    template: '%s',
  },
  description: META_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Court Hub',
    locale: 'ar_AE',
    images: ['/images/hero_padel_night_view_1779713624496.png'],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ArabicRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-ink text-white antialiased">
        <NavigationFlag />
        <StudioEditBridge />
        <LocaleProvider locale="ar">
        <MotionProvider>
          <CartProvider>
            <TournamentStoreProvider>
              {children}
              <CartDrawer />
            </TournamentStoreProvider>
          </CartProvider>
        </MotionProvider>
        </LocaleProvider>
        <Cursor />
      </body>
    </html>
  );
}
