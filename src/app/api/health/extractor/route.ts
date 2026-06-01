import { NextRequest, NextResponse } from 'next/server';
import { checkExtractorHealth } from '@/lib/stream-extractor';

// Synthetic monitor for the HLS extractor. The TV app silently falls back to the
// unplayable Videasy iframe when extraction fails, so this endpoint surfaces the
// failure (token drift, outage, or Videasy markup breakage) explicitly. Used by
// the scheduled Extractor Health workflow and any admin status badge.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function deepAllowed(req: NextRequest): boolean {
  const expected = (process.env.STREAM_EXTRACTOR_TOKEN ?? process.env.EXTRACTOR_AUTH_TOKEN ?? '').trim();
  if (!expected) return false;
  const provided = (
    req.headers.get('x-health-token') ??
    req.nextUrl.searchParams.get('token') ??
    ''
  ).trim();
  return provided.length > 0 && provided === expected;
}

export async function GET(req: NextRequest) {
  // Deep extraction is expensive (spins headless Chrome) — gate it behind the
  // shared token so the public shallow check can't be used to hammer the box.
  const deep = req.nextUrl.searchParams.get('deep') === '1' && deepAllowed(req);

  const health = await checkExtractorHealth({
    deep,
    signal: AbortSignal.timeout(deep ? 55_000 : 10_000),
  });

  return NextResponse.json(
    { ...health, deepRequested: req.nextUrl.searchParams.get('deep') === '1', checkedAt: new Date().toISOString() },
    { status: health.ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
