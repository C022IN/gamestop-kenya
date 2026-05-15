import { NextRequest, NextResponse } from 'next/server';
import { MOVIE_SESSION_COOKIE, getSessionByToken } from '@/lib/movie-platform';
import { discoverByGenre, tmdbPoster, tmdbBackdrop } from '@/lib/tmdb';

// GET /api/movies/discover?type=movie&genre_id=28
// Powers Home genre rows ("Action", "Comedy", …).
export async function GET(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const session = await getSessionByToken(token);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const type = req.nextUrl.searchParams.get('type') === 'tv' ? 'tv' : 'movie';
  const genreId = Number(req.nextUrl.searchParams.get('genre_id'));
  if (!Number.isFinite(genreId) || genreId <= 0) {
    return NextResponse.json({ error: 'genre_id required' }, { status: 400 });
  }

  const d = await discoverByGenre(type, genreId);
  if (!d) return NextResponse.json({ items: [] });

  return NextResponse.json({
    items: (d.results ?? []).slice(0, 20).map(i => ({
      id: i.id,
      media_type: type,
      title: i.title ?? i.name,
      name: i.name,
      overview: i.overview,
      poster_path: i.poster_path,
      backdrop_path: i.backdrop_path,
      poster_url: tmdbPoster(i.poster_path),
      backdrop_url: tmdbBackdrop(i.backdrop_path),
      vote_average: i.vote_average,
      release_date: i.release_date ?? (i as { first_air_date?: string }).first_air_date,
    })),
  });
}
