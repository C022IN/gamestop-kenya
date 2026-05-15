import { NextRequest, NextResponse } from 'next/server';
import { MOVIE_SESSION_COOKIE, getSessionByToken } from '@/lib/movie-platform';
import { TMDB_IMAGE_BASE } from '@/lib/tmdb';

// GET /api/movies/images?id=550&type=movie
// Returns the best English title logo (or null) so the TV hero can render
// the title as a transparent PNG instead of plain text. Falls back to the
// highest-voted language-agnostic logo if no English logo exists.
interface TmdbLogo {
  file_path: string;
  vote_average: number;
  iso_639_1: string | null;
  width: number;
  height: number;
}

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

  const apiKey = process.env.TMDB_API_KEY ?? '';
  const base = process.env.TMDB_API_BASE_URL?.trim() || 'https://api.themoviedb.org/3';
  const url = new URL(`${base}/${type}/${id}/images`);
  url.searchParams.set('include_image_language', 'en,null');
  if (apiKey) url.searchParams.set('api_key', apiKey);

  let logos: TmdbLogo[] = [];
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json() as { logos?: TmdbLogo[] };
      logos = data.logos ?? [];
    }
  } catch { /* fall through with empty list */ }

  // Prefer English, then highest vote_average, then widest aspect ratio
  const ranked = logos
    .filter(l => l.iso_639_1 === 'en' || l.iso_639_1 === null)
    .sort((a, b) => {
      const aLang = a.iso_639_1 === 'en' ? 0 : 1;
      const bLang = b.iso_639_1 === 'en' ? 0 : 1;
      if (aLang !== bLang) return aLang - bLang;
      return b.vote_average - a.vote_average;
    });

  const best = ranked[0];
  if (!best) return NextResponse.json({ logo_url: null });

  return NextResponse.json({
    logo_url: `${TMDB_IMAGE_BASE}/w500${best.file_path}`,
    aspect: best.width && best.height ? best.width / best.height : 2,
  });
}
