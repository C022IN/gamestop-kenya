import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/admin-auth';
import { requireAdminRequest } from '@/domains/admin/api/request-context';

export const dynamic = 'force-dynamic';

interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    metadata?: {
      title?: string;
      description?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
      keywords?: string;
      sourceURL?: string;
    };
  };
  error?: string;
}

interface ProbeResult {
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string;
  sourceUrl: string;
  rawMarkdown: string;
}

function extractPrice(markdown: string): number | null {
  // Look for KES / KSh / Ksh price patterns first, then fallback to generic
  const kesMatch = markdown.match(/(?:KES|KSh|Ksh)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (kesMatch) return parseFloat(kesMatch[1].replace(/,/g, ''));

  const priceMatch = markdown.match(/(?:price|cost|buy)[^\n]*?([\d,]+(?:\.\d{2})?)/i);
  if (priceMatch) return parseFloat(priceMatch[1].replace(/,/g, ''));

  return null;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) return auth.response;

  const { admin } = auth.context.current;
  if (!isSuperAdmin(admin) && admin.adminType !== 'catalog') {
    return NextResponse.json({ error: 'Catalog admin access only.' }, { status: 403 });
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'FIRECRAWL_API_KEY is not configured. Add it to your environment variables.' },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: 'A valid https:// URL is required.' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'extract'],
        extract: {
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Product name or title' },
              description: {
                type: 'string',
                description: 'Product description (1–3 sentences)',
              },
              price: { type: 'number', description: 'Product price (numeric, KES if available)' },
              platform: {
                type: 'string',
                description:
                  'Gaming platform (e.g. PS5, Xbox, Nintendo Switch) or null if not applicable',
              },
              images: {
                type: 'array',
                items: { type: 'string' },
                description: 'Product image URLs found on the page',
              },
            },
          },
        },
        onlyMainContent: true,
        timeout: 20000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      return NextResponse.json(
        { error: `Firecrawl error (${response.status}): ${errorText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const fc = (await response.json()) as FirecrawlScrapeResponse;

    if (!fc.success || !fc.data) {
      return NextResponse.json(
        { error: fc.error ?? 'Firecrawl returned no data.' },
        { status: 502 }
      );
    }

    const meta = fc.data.metadata ?? {};
    const extract = (fc.data as unknown as Record<string, unknown>).extract as
      | Record<string, unknown>
      | undefined;

    const result: ProbeResult = {
      title:
        (extract?.title as string | undefined) ??
        meta.ogTitle ??
        meta.title ??
        '',
      description:
        (extract?.description as string | undefined) ??
        meta.ogDescription ??
        meta.description ??
        '',
      metaTitle: meta.ogTitle ?? meta.title ?? '',
      metaDescription: meta.ogDescription ?? meta.description ?? '',
      keywords: meta.keywords ?? '',
      ogImage: meta.ogImage ?? (extract?.images as string[] | undefined)?.[0] ?? '',
      sourceUrl: meta.sourceURL ?? url,
      rawMarkdown: fc.data.markdown ?? '',
    };

    // Attach structured extracted fields if available
    const structured: Record<string, unknown> = {};
    if (extract?.price && typeof extract.price === 'number') {
      structured.price = extract.price;
    } else if (fc.data.markdown) {
      const inferred = extractPrice(fc.data.markdown);
      if (inferred) structured.price = inferred;
    }
    if (extract?.platform) structured.platform = extract.platform;
    if (Array.isArray(extract?.images) && (extract.images as string[]).length > 0) {
      structured.images = extract.images;
    }

    return NextResponse.json({ ok: true, result, structured });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Probe failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
