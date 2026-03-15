import { NextRequest, NextResponse } from 'next/server';
import {
  flattenCatalogEntries,
  matchesSearchFilter,
  searchCatalogEntries,
  toCatalogTiles,
  toTmdbTiles,
  type MoviesSearchFilter,
} from '@/lib/movie-hub';
import { getIptvCatalogSections } from '@/lib/iptv-catalog';
import { searchMulti } from '@/lib/tmdb';

function parseFilter(value: string | null): MoviesSearchFilter {
  switch (value) {
    case 'movie':
    case 'series':
    case 'live':
    case 'sports':
      return value;
    default:
      return 'all';
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const filter = parseFilter(req.nextUrl.searchParams.get('type'));

  if (query.length < 2) {
    return NextResponse.json(
      { query, filter, libraryResults: [], tmdbResults: [] },
      { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } }
    );
  }

  const [catalog, tmdbData] = await Promise.all([
    getIptvCatalogSections(),
    searchMulti(query),
  ]);

  const libraryResults = toCatalogTiles(
    searchCatalogEntries(flattenCatalogEntries(catalog), query, 8),
    8
  ).filter((item) => matchesSearchFilter(item, filter));

  const tmdbResults = toTmdbTiles(tmdbData?.results ?? [], 'movie', 8).filter((item) =>
    matchesSearchFilter(item, filter)
  );

  return NextResponse.json(
    { query, filter, libraryResults, tmdbResults },
    { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } }
  );
}
