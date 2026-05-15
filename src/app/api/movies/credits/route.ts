import { NextRequest, NextResponse } from 'next/server';
import { MOVIE_SESSION_COOKIE, getSessionByToken } from '@/lib/movie-platform';
import { getCredits, TMDB_IMAGE_BASE } from '@/lib/tmdb';

// GET /api/movies/credits?id=550&type=movie
// Returns the top cast for a TMDB title.
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

  const c = await getCredits(type, id);
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    cast: (c.cast ?? []).slice(0, 20).map(m => ({
      name: m.name,
      character: m.character,
      profile_url: m.profile_path ? `${TMDB_IMAGE_BASE}/w185${m.profile_path}` : '',
    })),
  });
}
