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
} from '@/lib/compatible-player';
import { extractStream, isStreamExtractorConfigured } from '@/lib/stream-extractor';

// Allow up to 60 s on Vercel so the extractor (which waits up to 35 s for an
// m3u8) has room to finish. Without this the default 10 s hobby/25 s pro limit
// can fire before extraction completes, causing a silent iframe fallback.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const session = await getSessionByToken(token);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const slug = req.nextUrl.searchParams.get('slug') ?? '';
  const id = req.nextUrl.searchParams.get('id') ?? '';
  const rawMediaType = req.nextUrl.searchParams.get('media_type') ?? 'movie';
  const mediaType: 'movie' | 'tv' = rawMediaType === 'tv' ? 'tv' : 'movie';
  const season = Number(req.nextUrl.searchParams.get('season') ?? '1');
  const episode = Number(req.nextUrl.searchParams.get('episode') ?? '1');

  if (!slug && !id) {
    return NextResponse.json({ error: 'slug or id required' }, { status: 400 });
  }

  const numericId = Number(id || slug);
  if (Number.isFinite(numericId) && numericId > 0) {
    // Preferred path: ask the extractor service for a direct HLS URL.
    // Android TV's ExoPlayer (via expo-av) plays HLS reliably; iframe playback
    // doesn't work in the TV WebView. If extractor isn't configured or fails,
    // we fall back to the iframe URL which still works on the web client.
    if (isStreamExtractorConfigured()) {
      const extracted = await extractStream({
        tmdbId: numericId,
        mediaType,
        season,
        episode,
        signal: AbortSignal.timeout(45_000),
      });
      if (extracted) {
        return NextResponse.json({
          stream_url: extracted.m3u8,
          source_type: 'hls',
          playback_mode: 'video',
          provider: 'Videasy (extracted)',
          stream_headers: extracted.headers,
        });
      }
      // fall through to iframe fallback
    }

    const iframeUrl = mediaType === 'tv'
      ? buildCompatibleTvPlayerUrl(numericId, season, episode)
      : buildCompatibleMoviePlayerUrl(numericId);

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

  // Custom content item path (slug-based entries in the DB)
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
