// Product detail: identical logic to the English route (real catalog lookup,
// 404 for unknown/unavailable slugs); all chrome localizes via LocaleProvider.
export { default, generateMetadata } from '@/app/(en)/(swipe)/shop/[slug]/page';

// Segment config must be a literal in each route file (Next reads it statically).
export const revalidate = 300;
