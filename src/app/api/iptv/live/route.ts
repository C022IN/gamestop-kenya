import { NextRequest, NextResponse } from 'next/server';
import { fetchCategoryChannels, fetchMultipleCategories, CHANNEL_CATEGORIES } from '@/lib/iptv-org';

export const revalidate = 3600;

/**
 * GET /api/iptv/live?cat=sports            → channels for one category
 * GET /api/iptv/live?cat=sports,news,kenya → multiple categories (parallel)
 * GET /api/iptv/live                        → all categories overview
 */
export async function GET(req: NextRequest) {
  const catParam = req.nextUrl.searchParams.get('cat') ?? '';
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 40), 100);

  // List available categories
  if (!catParam) {
    return NextResponse.json({
      categories: Object.entries(CHANNEL_CATEGORIES).map(([key, val]) => ({
        key,
        label: val.label,
        emoji: val.emoji,
      })),
    }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } });
  }

  const keys = catParam.split(',').map((k) => k.trim()).filter(Boolean);

  if (keys.length === 1) {
    const channels = await fetchCategoryChannels(keys[0], limit);
    return NextResponse.json({ category: keys[0], channels }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    });
  }

  const data = await fetchMultipleCategories(keys, limit);
  return NextResponse.json({ categories: data }, {
    headers: { 'Cache-Control': 'public, s-maxage=3600' },
  });
}
