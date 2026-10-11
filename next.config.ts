import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin;
  } catch {
    return '';
  }
})();

// Content-Security-Policy: the browser refuses anything not listed here, so an
// injected <script src=evil> or a form posting card data elsewhere simply
// cannot run. Production only (dev tooling needs eval + websockets).
// 'unsafe-inline' scripts remain required by Next's inline bootstrap without
// nonces; every external source is still blocked.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  `connect-src 'self' blob: data: ${supabaseOrigin}`.trim(),
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't advertise the framework/version
  experimental: { serverActions: { bodySizeLimit: '25mb' } },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
  async redirects() {
    // FAQ page was removed from the contract scope — its content lives on /contact.
    return [{ source: '/faq', destination: '/contact', permanent: false }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // SAMEORIGIN (not DENY): the Content Studio previews the site in a
          // same-origin iframe.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          ...(isProd
            ? [
                { key: 'Content-Security-Policy', value: csp },
                // Browsers will only ever talk to courthub.ae over HTTPS (2 years).
                { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
              ]
            : []),
        ],
      },
      {
        // Never cache customer-specific or admin pages in any shared cache.
        source: '/(admin|order|api)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
