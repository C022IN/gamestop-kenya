import { NextRequest, NextResponse } from 'next/server';
import { MOVIE_SESSION_COOKIE, getSessionByToken } from '@/lib/movie-platform';
import { getVideos } from '@/lib/tmdb';

// GET /api/movies/videos?id=550&type=movie
// Returns the best YouTube trailer key for the hero auto-preview on the TV
// home screen. Picks Official Trailer > Trailer > Teaser, then most recent.
//
// NOTE: The auto-preview feature consuming this endpoint embeds YouTube via
// WebView with autoplay=1, which is incompatible with YouTube's Terms of
// Service for unattended embedded playback. This is acceptable for sideload
// distribution; see tv-app/STORE_SUBMISSION.md before publishing to Play Store.
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

  const v = await getVideos(type, id);
  const results = v?.results ?? [];

  // Rank: YouTube only, then Trailer > Teaser > Other, then Official first
  const ranked = results
    .filter(r => r.site === 'YouTube' && r.key)
    .sort((a, b) => {
      const typeRank = (r: typeof a) =>
        r.type === 'Trailer' ? 0 :
        r.type === 'Teaser'  ? 1 :
        r.type === 'Clip'    ? 2 : 3;
      const aR = typeRank(a) - typeRank(b);
      if (aR !== 0) return aR;
      // Official trailers preferred within the same type
      return (b.official ? 1 : 0) - (a.official ? 1 : 0);
    });

  const best = ranked[0];
  return NextResponse.json({ key: best?.key ?? null });
}
