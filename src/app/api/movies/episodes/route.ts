import { NextRequest, NextResponse } from 'next/server';
import { MOVIE_SESSION_COOKIE, getSessionByToken } from '@/lib/movie-platform';
import { getSeasonDetails, tmdbBackdrop } from '@/lib/tmdb';

// GET /api/movies/episodes?tv_id=1399&season=1
// Returns the TMDB episode list for a series season with still thumbnails
// normalised into absolute URLs so the TV client doesn't need the image base.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const session = await getSessionByToken(token);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const tvId = Number(req.nextUrl.searchParams.get('tv_id'));
  const season = Number(req.nextUrl.searchParams.get('season') ?? '1');
  if (!Number.isFinite(tvId) || tvId <= 0) {
    return NextResponse.json({ error: 'tv_id required' }, { status: 400 });
  }

  const data = await getSeasonDetails(tvId, season);
  if (!data) return NextResponse.json({ error: 'Season not found' }, { status: 404 });

  return NextResponse.json({
    season_number: data.season_number,
    name: data.name,
    overview: data.overview,
    episodes: data.episodes.map(ep => ({
      id: ep.id,
      episode_number: ep.episode_number,
      season_number: ep.season_number,
      name: ep.name,
      overview: ep.overview,
      still_path: ep.still_path,
      still_url: ep.still_path ? tmdbBackdrop(ep.still_path, 'w780') : '',
      air_date: ep.air_date,
      runtime: ep.runtime,
      vote_average: ep.vote_average,
    })),
  });
}
