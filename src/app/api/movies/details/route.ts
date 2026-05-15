import { NextRequest, NextResponse } from 'next/server';
import { MOVIE_SESSION_COOKIE, getSessionByToken } from '@/lib/movie-platform';
import { getDetails, tmdbBackdrop, tmdbPoster } from '@/lib/tmdb';

// GET /api/movies/details?id=550&type=movie
// Returns full TMDB details: genres, runtime, seasons summary (for TV).
export async function GET(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const session = await getSessionByToken(token);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const id = Number(req.nextUrl.searchParams.get('id'));
  const type = req.nextUrl.searchParams.get('type') === 'tv' ? 'tv' : 'movie';
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const d = await getDetails(type, id);
  if (!d) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: d.id,
    media_type: type,
    title: d.title ?? d.name,
    name: d.name,
    overview: d.overview,
    tagline: d.tagline,
    runtime: d.runtime,
    status: d.status,
    vote_average: d.vote_average,
    release_date: d.release_date ?? d.first_air_date,
    poster_url: tmdbPoster(d.poster_path),
    backdrop_url: tmdbBackdrop(d.backdrop_path),
    genres: d.genres ?? [],
    number_of_seasons: d.number_of_seasons,
    number_of_episodes: d.number_of_episodes,
    seasons: (d.seasons ?? [])
      .filter(s => s.season_number > 0) // hide TMDB "Specials" by default
      .map(s => ({
        season_number: s.season_number,
        name: s.name,
        overview: s.overview,
        episode_count: s.episode_count,
        air_date: s.air_date,
        poster_url: s.poster_path ? tmdbPoster(s.poster_path) : '',
      })),
  });
}
