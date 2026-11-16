// Fictional data only. Never copy a real customer's address into preview artifacts.
module.exports = {
  id: 'c0a71601-1234-4000-8000-000000000001', created_at: '2026-11-16T05:30:00.000Z',
  customer_name: 'Alex Sample', customer_email: 'sample@example.com', customer_phone: '+971 50 000 0000',
  shipping: { name: 'Alex Sample', address: { line1: 'Sample address, not for delivery', line2: 'Apartment 12', city: 'Dubai', country: 'AE' } },
  items: [
    { id: 'sample-racket', title: 'AT10 Genius Attack 12K Alum XTREM 2026', qty: 1, price_aed: 1149.99,
      image: 'https://courthub.ae/product-images/v1.3/at10-genius-attack-12k-alum-xtrem-2026-by-agustin-tapia.png' },
    { id: 'sample-second-racket', title: 'ML10 Ventus 3K by Miguel Lamperti', qty: 2, price_aed: 1099,
      image: 'https://courthub.ae/product-images/v1.3/ml10-ventus-3k-by-miguel-lamperti.png' },
  ],
  amount_aed: 3347.99, locale: 'en', test: true,
};
