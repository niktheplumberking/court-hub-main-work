import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
        ],
      },
    ];
  },
};

export default nextConfig;
