import { redirect } from 'next/navigation';
import MoviesHubClient from '@/components/movies/MoviesHubClient';
import type { MoviesHubSection } from '@/components/movies/movie-hub-types';
import { getIptvCatalogSections } from '@/lib/iptv-catalog';
import { getMovieMembershipState } from '@/lib/movie-platform';
import { getCurrentMovieMember } from '@/lib/movie-session';
import {
  discoverByGenre,
  getPopular,
  getTopRated,
  getTrending,
} from '@/lib/tmdb';
import {
  MOVIE_HUB_TOP_10_LIMIT,
  toCatalogTiles,
  toResumeTiles,
  toTmdbTiles,
  uniqueTilesById,
} from '@/lib/movie-hub';
import { getResumePositions } from '@/lib/movie-platform';

export const dynamic = 'force-dynamic';

const MOVIE_GENRE_CONFIG = [
  { id: 'genre-action', title: 'Action', genreId: 28 },
  { id: 'genre-adventure', title: 'Adventure', genreId: 12 },
  { id: 'genre-animation', title: 'Animation', genreId: 16 },
  { id: 'genre-comedy', title: 'Comedy', genreId: 35 },
  { id: 'genre-crime', title: 'Crime', genreId: 80 },
  { id: 'genre-drama', title: 'Drama', genreId: 18 },
  { id: 'genre-family', title: 'Family', genreId: 10751 },
  { id: 'genre-fantasy', title: 'Fantasy', genreId: 14 },
  { id: 'genre-horror', title: 'Horror', genreId: 27 },
  { id: 'genre-romance', title: 'Romance', genreId: 10749 },
  { id: 'genre-sci-fi', title: 'Sci-Fi', genreId: 878 },
  { id: 'genre-thriller', title: 'Thriller', genreId: 53 },
] as const;

export default async function MoviesPage() {
  const memberState = await getCurrentMovieMember();
  if (!memberState) {
    redirect('/movies/login');
  }

  const { profile } = memberState;
  const [
    catalog,
    membership,
    resumePositions,
    trendingMovies,
    popularMovies,
    popularTv,
    topRatedMovies,
    topRatedSeries,
    ...genreResults
  ] = await Promise.all([
    getIptvCatalogSections(),
    getMovieMembershipState(profile.profileId),
    getResumePositions(profile.profileId),
    getTrending('movie'),
    getPopular('movie'),
    getPopular('tv'),
    getTopRated('movie'),
    getTopRated('tv'),
    ...MOVIE_GENRE_CONFIG.map((genre) => discoverByGenre('movie', genre.genreId)),
  ]);

  const hasActive = membership.hasActiveSubscription;
  const primarySubscription = membership.latestSubscription;
  const accessState = hasActive ? 'active' : primarySubscription ? 'expired' : 'none';
  const featuredTiles = toCatalogTiles(catalog.featured);
  const sportsTiles = toCatalogTiles(catalog.sportsEvents);
  const liveTiles = toCatalogTiles(catalog.liveChannels);
  const movieTiles = toCatalogTiles(catalog.movies);
  const seriesTiles = toCatalogTiles(catalog.series);

  const trendingTiles = toTmdbTiles(trendingMovies?.results ?? [], 'movie');
  const popularMovieTiles = toTmdbTiles(popularMovies?.results ?? [], 'movie');
  const popularTvTiles = toTmdbTiles(popularTv?.results ?? [], 'tv');
  const top10MovieTiles = toTmdbTiles(
    topRatedMovies?.results ?? [],
    'movie',
    MOVIE_HUB_TOP_10_LIMIT,
    true
  );
  const top10SeriesTiles = toTmdbTiles(
    topRatedSeries?.results ?? [],
    'tv',
    MOVIE_HUB_TOP_10_LIMIT,
    true
  );
  const genreSections = MOVIE_GENRE_CONFIG.map((genre, index) => ({
    id: genre.id,
    title: genre.title,
    items: toTmdbTiles(genreResults[index]?.results ?? [], 'movie'),
    eyebrow: 'Genre',
  })).filter((section) => section.items.length > 0);

  const spotlightItems = uniqueTilesById([
    ...trendingTiles.slice(0, 2),
    ...top10MovieTiles.slice(0, 1),
    ...top10SeriesTiles.slice(0, 1),
    ...featuredTiles.slice(0, 1),
  ]).slice(0, 5);

  const continueTiles = toResumeTiles(resumePositions);

  const sections: MoviesHubSection[] = [
    ...(continueTiles.length > 0
      ? [{
          id: 'continue-watching',
          title: 'Continue Watching',
          items: continueTiles,
          eyebrow: 'Pick up where you left off',
        }]
      : []),
    {
      id: 'featured',
      title: 'Featured on GameStop',
      items: featuredTiles,
      accent:
        'bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.18),transparent_24%)]',
      eyebrow: 'Featured',
    },
    { id: 'trending-now', title: 'Trending Now', items: trendingTiles, eyebrow: 'Popular now' },
    {
      id: 'top-10-movies',
      title: 'Top 10 Movies',
      items: top10MovieTiles,
      eyebrow: 'Charts',
    },
    {
      id: 'top-10-series',
      title: 'Top 10 Series',
      items: top10SeriesTiles,
      eyebrow: 'Charts',
    },
    {
      id: 'popular-movies',
      title: 'Popular Movies',
      items: popularMovieTiles,
      eyebrow: 'More picks',
    },
    { id: 'tv-shows', title: 'TV Shows', items: popularTvTiles, eyebrow: 'Series' },
    ...genreSections,
    {
      id: 'sports',
      title: 'Sports and Events',
      items: sportsTiles,
      accent:
        'bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.18),transparent_24%)]',
      eyebrow: 'Live',
    },
    { id: 'live-tv', title: 'Live TV Channels', items: liveTiles, eyebrow: 'Live' },
    { id: 'movie-library', title: 'Licensed Movie Library', items: movieTiles, eyebrow: 'Library' },
    { id: 'series-library', title: 'Series Library', items: seriesTiles, eyebrow: 'Library' },
  ];

  return (
    <MoviesHubClient
      profileId={profile.profileId}
      hasActive={hasActive}
      playbackLocked={!hasActive}
      accessState={accessState}
      subscriptionLabel={primarySubscription?.planName ?? null}
      subscriptionEndsLabel={
        primarySubscription?.expiresAt
          ? new Date(primarySubscription.expiresAt).toLocaleDateString('en-KE', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : null
      }
      spotlightItems={spotlightItems}
      sections={sections}
      tvSetup={
        hasActive && primarySubscription?.credentials
          ? {
              playlistUrl: primarySubscription.credentials.m3uUrl,
              xtreamHost: primarySubscription.credentials.xtreamHost,
              xtreamUsername: primarySubscription.credentials.xtreamUsername,
              xtreamPassword: primarySubscription.credentials.xtreamPassword,
            }
          : null
      }
    />
  );
}
