import type { Product } from './types';

/** Apply the client's punctuation preference to displayed copy, never URLs or stored data. */
export function cleanText(value: string): string {
  return value.replace(/[ \t]*(?:\u2014|&mdash;|&#8212;|&#x2014;)[ \t]*/gi, ', ');
}

export function plainText(value: string): string {
  return cleanText(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function cleanProductCopy(product: Product): Product {
  return {
    ...product,
    title: cleanText(product.title),
    brand: product.brand ? cleanText(product.brand) : product.brand,
    model: product.model ? cleanText(product.model) : product.model,
    description: product.description ? cleanText(product.description) : product.description,
    specs: product.specs ? Object.fromEntries(Object.entries(product.specs).map(([key, value]) => [key, typeof value === 'string' ? cleanText(value) : value])) : product.specs,
    categories: product.categories ? { ...product.categories, name: cleanText(product.categories.name) } : product.categories,
  };
}
