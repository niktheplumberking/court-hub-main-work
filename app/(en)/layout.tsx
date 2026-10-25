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
  ...pageMetadata('/', 'en', { title: SITE_TITLE.en, description: SITE_DESCRIPTION.en }),
  metadataBase: new URL(SITE_URL),
  applicationName: 'Court Hub',
  title: { default: SITE_TITLE.en, template: '%s' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="bg-ink text-white antialiased">
        <JsonLd data={organizationSchema()} />
        {/* Persists across navigations (above the page) so it can record the
            first in-app route change — drives the homepage's first-landing-only
            preloader. Renders nothing. */}
        <NavigationFlag />
        {/* No-op on the normal site; enables click-to-edit inside the Studio preview. */}
        <StudioEditBridge />
        <LocaleProvider locale="en">
        <MotionProvider>
          <CartProvider>
            {/* Tournaments session store lives at the root (like the cart) so
                bookings, admin-created tournaments and points edits survive
                client navigations — inside the (swipe) layout it would remount
                (and reset) on every route change. */}
            <TournamentStoreProvider>
              {children}
              {/* Global live cart: floating bag button + slide-in drawer, on every page. */}
              <CartDrawer />
              <TennisBallScroll />
            </TournamentStoreProvider>
          </CartProvider>
        </MotionProvider>
        </LocaleProvider>
        {/* Cursor lives in the layout (NOT template.tsx) so it persists across
            route changes instead of remounting and briefly leaving the user
            with no visible cursor. */}
        <Cursor />
      </body>
    </html>
  );
}
