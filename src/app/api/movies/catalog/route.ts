import { NextRequest, NextResponse } from 'next/server';
import { getCatalogForSession, MOVIE_SESSION_COOKIE } from '@/domains/iptv/services/catalog-service';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  const result = await getCatalogForSession(token);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}
