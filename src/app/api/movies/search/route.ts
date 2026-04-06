import { NextRequest, NextResponse } from 'next/server';
import {
  flattenCatalogEntries,
  matchesSearchFilter,
  searchCatalogEntries,
  toCatalogTiles,
  toTmdbTiles,
  type MoviesSearchFilter,
} from '@/lib/movie-hub';
import { getIptvCatalogSections, hasConfiguredPlayback } from '@/lib/iptv-catalog';
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

function isKodiClient(req: NextRequest) {
  const userAgent = req.headers.get('user-agent')?.toLowerCase() ?? '';
  return userAgent.includes('kodi/gamestopkenya');
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const filter = parseFilter(req.nextUrl.searchParams.get('type'));
  const kodiClient = isKodiClient(req);

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

  const matchingCatalogEntries = searchCatalogEntries(flattenCatalogEntries(catalog), query, 8)
    .filter((entry) => !kodiClient || hasConfiguredPlayback(entry));

  const libraryResults = toCatalogTiles(matchingCatalogEntries, 8).filter((item) =>
    matchesSearchFilter(item, filter)
  );

  const tmdbResults = kodiClient
    ? []
    : toTmdbTiles(tmdbData?.results ?? [], 'movie', 8).filter((item) =>
        matchesSearchFilter(item, filter)
      );

  return NextResponse.json(
    { query, filter, libraryResults, tmdbResults },
    { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } }
  );
}
