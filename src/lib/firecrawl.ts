const API_BASE = 'https://api.firecrawl.dev/v1';

interface FirecrawlExtractResult {
  productName?: string;
  mainImageUrl?: string;
  galleryImages?: string[];
}

interface ScrapeResponse {
  success: boolean;
  data?: {
    extract?: FirecrawlExtractResult;
    metadata?: {
      'og:image'?: string;
      ogImage?: string;
      thumbnail?: string;
    };
  };
}

function absoluteUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http')) return url;
  return '';
}

export async function scrapeProductImage(pageUrl: string): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY is not set');

  const res = await fetch(`${API_BASE}/scrape`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: pageUrl,
      formats: ['extract'],
      extract: {
        schema: {
          type: 'object',
          properties: {
            productName: { type: 'string' },
            mainImageUrl: {
              type: 'string',
              description: 'The main hero or product shot image URL — prefer a clean product-on-white or product-on-dark-background image, not a lifestyle or banner image.',
            },
            galleryImages: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    }),
  });

  if (!res.ok) return null;

  const json: ScrapeResponse = await res.json();
  if (!json.success || !json.data) return null;

  const extract = json.data.extract;
  const meta = json.data.metadata;

  // Prefer the LLM-extracted main image URL, fall back to OG/thumbnail
  const candidates = [
    extract?.mainImageUrl,
    meta?.['og:image'],
    meta?.ogImage,
    meta?.thumbnail,
    ...(extract?.galleryImages ?? []),
  ].map(absoluteUrl).filter(Boolean);

  return candidates[0] ?? null;
}

export interface EnrichedImages {
  [productId: string]: {
    url: string;
    source: string;
    fetchedAt: string;
  };
}
