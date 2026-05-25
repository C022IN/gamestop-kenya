import enrichedImages from '@/data/enriched-images.json';

type EnrichedCache = Record<string, { url: string; source: string; fetchedAt: string }>;

const cache = enrichedImages as EnrichedCache;

/**
 * Returns the Firecrawl-enriched image URL for a product, or the fallback
 * if the product has not been enriched yet.
 */
export function enrichedImage(productId: string, fallback: string): string {
  return cache[productId]?.url ?? fallback;
}
