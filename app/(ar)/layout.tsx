import { pageMetadata, SITE_URL, SITE_TITLE, SITE_DESCRIPTION, organizationSchema } from '@/lib/seo';
import JsonLd from '@/components/shared/JsonLd';
import type { Metadata } from 'next';
import '../globals.css';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import { CartProvider } from '@/lib/cart-context';
import { TournamentStoreProvider } from '@/lib/tournaments/store';
import CartDrawer from '@/components/cart/CartDrawer';
import TennisBallScroll from '@/components/shared/TennisBallScroll';
import MotionProvider from '@/components/shared/MotionProvider';
import Cursor from '@/components/shared/Cursor';
import NavigationFlag from '@/components/shared/NavigationFlag';
import StudioEditBridge from '@/components/shared/StudioEditBridge';

export const metadata: Metadata = {
  ...pageMetadata('/', 'ar', { title: SITE_TITLE.ar, description: SITE_DESCRIPTION.ar }),
  metadataBase: new URL(SITE_URL),
  applicationName: 'Court Hub',
  title: { default: SITE_TITLE.ar, template: '%s' },
};

export default function ArabicRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-ink text-white antialiased">
        <JsonLd data={organizationSchema()} />
        <NavigationFlag />
        <StudioEditBridge />
        <LocaleProvider locale="ar">
        <MotionProvider>
          <CartProvider>
            <TournamentStoreProvider>
              {children}
              <CartDrawer />
              <TennisBallScroll />
            </TournamentStoreProvider>
          </CartProvider>
        </MotionProvider>
        </LocaleProvider>
        <Cursor />
      </body>
    </html>
  );
}
