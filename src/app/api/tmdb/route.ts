import { NextRequest, NextResponse } from 'next/server';
import {
  getTrending,
  getPopular,
  getTopRated,
  discoverByGenre,
  getDetails,
  getVideos,
  getCredits,
  getSimilar,
  getSeasonDetails,
  searchMulti,
  isTmdbConfigured,
} from '@/lib/tmdb';

/**
 * GET /api/tmdb?action=trending&type=movie&window=week
 * GET /api/tmdb?action=popular&type=tv
 * GET /api/tmdb?action=top_rated&type=movie
 * GET /api/tmdb?action=discover&type=movie&genre=28
 * GET /api/tmdb?action=details&type=movie&id=123
 * GET /api/tmdb?action=videos&type=movie&id=123
 * GET /api/tmdb?action=credits&type=movie&id=123
 * GET /api/tmdb?action=similar&type=movie&id=123
 * GET /api/tmdb?action=season&id=123&season=1
 * GET /api/tmdb?action=search&q=inception
 */
export async function GET(req: NextRequest) {
  if (!isTmdbConfigured()) {
    return NextResponse.json({ error: 'TMDB not configured' }, { status: 503 });
  }

  const p = req.nextUrl.searchParams;
  const action = p.get('action') ?? '';
  const type = (p.get('type') ?? 'movie') as 'movie' | 'tv';
  const id = Number(p.get('id'));

  const headers = { 'Cache-Control': 'public, s-maxage=3600' };

  switch (action) {
    case 'trending': {
      const mediaType = (p.get('type') ?? 'all') as 'movie' | 'tv' | 'all';
      const window = (p.get('window') ?? 'week') as 'day' | 'week';
      const data = await getTrending(mediaType, window);
      return NextResponse.json(data ?? { results: [] }, { headers });
    }
    case 'popular': {
      const data = await getPopular(type);
      return NextResponse.json(data ?? { results: [] }, { headers });
    }
    case 'top_rated': {
      const data = await getTopRated(type);
      return NextResponse.json(data ?? { results: [] }, { headers });
    }
    case 'discover': {
      const genre = Number(p.get('genre'));
      if (!genre) return NextResponse.json({ error: 'genre required' }, { status: 400 });
      const data = await discoverByGenre(type, genre);
      return NextResponse.json(data ?? { results: [] }, { headers });
    }
    case 'details': {
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const data = await getDetails(type, id);
      if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
      return NextResponse.json(data, { headers });
    }
    case 'videos': {
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const data = await getVideos(type, id);
      return NextResponse.json(data ?? { results: [] }, { headers });
    }
    case 'credits': {
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const data = await getCredits(type, id);
      return NextResponse.json(data ?? { cast: [] }, { headers });
    }
    case 'similar': {
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const data = await getSimilar(type, id);
      return NextResponse.json(data ?? { results: [] }, { headers });
    }
    case 'season': {
      const seasonNumber = Number(p.get('season'));
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      if (!seasonNumber) {
        return NextResponse.json({ error: 'season required' }, { status: 400 });
      }
      const data = await getSeasonDetails(id, seasonNumber);
      if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
      return NextResponse.json(data, { headers });
    }
    case 'search': {
      const q = p.get('q') ?? '';
      if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });
      const data = await searchMulti(q);
      return NextResponse.json(data ?? { results: [] }, { headers });
    }
    default:
      return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  }
}
