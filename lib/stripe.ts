import Stripe from 'stripe';

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith('sk_placeholder')) return null;
  // Load-test hook only (scripts/loadtest): routes the SDK to a local fake
  // Stripe. Never set on the server — unset means the real api.stripe.com.
  const base = process.env.STRIPE_API_BASE;
  if (base) {
    const u = new URL(base);
    return new Stripe(key, { host: u.hostname, port: Number(u.port), protocol: u.protocol.replace(':', '') as 'http' });
  }
  return new Stripe(key);
}

export const AED = 'aed';
/** AED uses 2 decimals (fils) — Stripe expects the smallest unit. */
export const toFils = (aed: number) => Math.round(aed * 100);
