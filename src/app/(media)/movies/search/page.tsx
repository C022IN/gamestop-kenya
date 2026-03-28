import { redirect } from 'next/navigation';
import MoviesSearchClient from '@/components/movies/MoviesSearchClient';
import {
  flattenCatalogEntries,
  matchesSearchFilter,
  searchCatalogEntries,
  toCatalogTiles,
  toTmdbTiles,
  uniqueTilesById,
  type MoviesSearchFilter,
} from '@/lib/movie-hub';
import { getIptvCatalogSections } from '@/lib/iptv-catalog';
import { getCurrentMovieMember } from '@/lib/movie-session';
import { searchMulti } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Search - GameStop IPTV' };

interface MoviesSearchPageProps {
  searchParams: Promise<{
    q?: string | string[];
    type?: string | string[];
  }>;
}

function toSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilter(value: string | undefined): MoviesSearchFilter {
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

export default async function MoviesSearchPage({ searchParams }: MoviesSearchPageProps) {
  const memberState = await getCurrentMovieMember();
  if (!memberState) {
    redirect('/movies/login');
  }

  const params = await searchParams;
  const initialQuery = toSingleValue(params.q)?.trim() ?? '';
  const filter = parseFilter(toSingleValue(params.type));
  const catalog = await getIptvCatalogSections();
  const flattenedCatalog = flattenCatalogEntries(catalog);

  const [tmdbData] = await Promise.all([
    initialQuery.length >= 2 ? searchMulti(initialQuery) : Promise.resolve(null),
  ]);

  const libraryResults = toCatalogTiles(searchCatalogEntries(flattenedCatalog, initialQuery, 24), 24).filter(
    (item) => matchesSearchFilter(item, filter)
  );
  const tmdbResults = toTmdbTiles(tmdbData?.results ?? [], 'movie', 24).filter((item) =>
    matchesSearchFilter(item, filter)
  );
  const suggestedResults = uniqueTilesById([
    ...toCatalogTiles(catalog.featured, 5),
    ...toCatalogTiles(catalog.movies, 4),
    ...toCatalogTiles(catalog.series, 4),
    ...toCatalogTiles(catalog.liveChannels, 3),
  ])
    .filter((item) => matchesSearchFilter(item, filter))
    .slice(0, 12);

  return (
    <MoviesSearchClient
      profileId={memberState.profile.profileId}
      initialQuery={initialQuery}
      filter={filter}
      libraryResults={libraryResults}
      tmdbResults={tmdbResults}
      suggestedResults={suggestedResults}
    />
  );
}
