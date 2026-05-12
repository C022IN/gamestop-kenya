import { NextRequest, NextResponse } from 'next/server';
import { MOVIE_SESSION_COOKIE, getSessionByToken } from '@/lib/movie-platform';
import { getTrending, getPopular, getTopRated, tmdbPoster, tmdbBackdrop, type TmdbItem } from '@/lib/tmdb';

function normaliseItem(item: TmdbItem, mediaType: string) {
  return {
    id: item.id,
    media_type: item.media_type ?? mediaType,
    title: item.title ?? item.name,
    name: item.name,
    overview: item.overview,
    poster_path: item.poster_path ?? null,
    backdrop_path: item.backdrop_path ?? null,
    poster_url: tmdbPoster(item.poster_path),
    backdrop_url: tmdbBackdrop(item.backdrop_path),
    vote_average: item.vote_average,
    release_date: item.release_date ?? item.first_air_date,
  };
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const session = await getSessionByToken(token);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const [trending, popularMovies, topRatedMovies, popularTv] = await Promise.all([
    getTrending('movie', 'week'),
    getPopular('movie'),
    getTopRated('movie'),
    getPopular('tv'),
  ]);

  const sections = [
    {
      id: 'trending_movies',
      title: 'Trending This Week',
      items: (trending?.results ?? []).slice(0, 20).map(i => normaliseItem(i, 'movie')),
    },
    {
      id: 'popular_movies',
      title: 'Popular Movies',
      items: (popularMovies?.results ?? []).slice(0, 20).map(i => normaliseItem(i, 'movie')),
    },
    {
      id: 'top_rated_movies',
      title: 'Top Rated',
      items: (topRatedMovies?.results ?? []).slice(0, 20).map(i => normaliseItem(i, 'movie')),
    },
    {
      id: 'popular_tv',
      title: 'Popular Series',
      items: (popularTv?.results ?? []).slice(0, 20).map(i => normaliseItem(i, 'tv')),
    },
  ].filter(s => s.items.length > 0);

  const allItems = sections[0]?.items ?? [];

  return NextResponse.json({ items: allItems, sections });
}
