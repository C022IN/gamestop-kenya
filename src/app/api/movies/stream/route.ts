import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionByToken,
  getContentItemBySlug,
  buildPlaybackSource,
  MOVIE_SESSION_COOKIE,
} from '@/lib/movie-platform';
import {
  buildCompatibleMoviePlayerUrl,
  buildCompatibleTvPlayerUrl,
  isCompatiblePlayerConfigured,
} from '@/lib/compatible-player';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const session = await getSessionByToken(token);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const slug = req.nextUrl.searchParams.get('slug') ?? '';
  const id = req.nextUrl.searchParams.get('id') ?? '';
  const mediaType = req.nextUrl.searchParams.get('media_type') ?? 'movie';

  if (!slug && !id) {
    return NextResponse.json({ error: 'slug or id required' }, { status: 400 });
  }

  // TMDB numeric ID path — build Videasy URL directly
  const numericId = Number(id || slug);
  if (Number.isFinite(numericId) && numericId > 0 && isCompatiblePlayerConfigured()) {
    let iframeUrl: string | null = null;

    if (mediaType === 'tv') {
      const season = Number(req.nextUrl.searchParams.get('season') ?? '1');
      const episode = Number(req.nextUrl.searchParams.get('episode') ?? '1');
      iframeUrl = buildCompatibleTvPlayerUrl(numericId, season, episode);
    } else {
      iframeUrl = buildCompatibleMoviePlayerUrl(numericId);
    }

    if (!iframeUrl) {
      return NextResponse.json({ error: 'Player not configured' }, { status: 503 });
    }

    return NextResponse.json({
      iframe_url: iframeUrl,
      stream_url: null,
      source_type: 'iframe',
      playback_mode: 'iframe',
      provider: 'Videasy',
    });
  }

  // Custom content item path (slug-based)
  const content = await getContentItemBySlug(slug || id);
  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  const source = await buildPlaybackSource(content);
  if (!source) {
    return NextResponse.json({ error: 'Stream not available' }, { status: 503 });
  }

  return NextResponse.json({
    stream_url: source.hlsUrl ?? source.videoUrl ?? source.externalUrl ?? source.iframeUrl,
    dash_url: source.dashUrl,
    iframe_url: source.iframeUrl,
    external_url: source.externalUrl,
    provider: source.provider,
    source_type: source.sourceType,
    playback_mode: source.playbackMode,
    signed: source.signed,
  });
}
