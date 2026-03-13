import { NextRequest, NextResponse } from 'next/server';
import { getMergedStorefrontProducts } from '@/lib/storefront-media';

export const revalidate = 300;

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get('kind');
  const ids = req.nextUrl.searchParams
    .get('ids')
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (kind !== 'games' && kind !== 'gift-cards' && kind !== 'hardware') {
    return NextResponse.json(
      { error: 'kind must be "games", "gift-cards", or "hardware"' },
      { status: 400 }
    );
  }

  const products = await getMergedStorefrontProducts(kind, ids?.length ? ids : undefined);
  return NextResponse.json({ products });
}
