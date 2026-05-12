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

// Fallback embed player used when COMPATIBLE_PLAYER_BASE_URL is not configured.
// vidlink.pro supports autoplay, works in Android WebView, and uses TMDB IDs.
const FALLBACK_PLAYER = 'https://vidlink.pro';

function buildFallbackMovieUrl(tmdbId: number): string {
  return `${FALLBACK_PLAYER}/movie/${tmdbId}?autoplay=true&multiLang=true`;
}

function buildFallbackTvUrl(tmdbId: number, season: number, episode: number): string {
  return `${FALLBACK_PLAYER}/tv/${tmdbId}/${season}/${episode}?autoplay=true&nextbutton=true&multiLang=true`;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const session = await getSessionByToken(token);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const slug = req.nextUrl.searchParams.get('slug') ?? '';
  const id = req.nextUrl.searchParams.get('id') ?? '';
  const mediaType = req.nextUrl.searchParams.get('media_type') ?? 'movie';
  const season = Number(req.nextUrl.searchParams.get('season') ?? '1');
  const episode = Number(req.nextUrl.searchParams.get('episode') ?? '1');

  if (!slug && !id) {
    return NextResponse.json({ error: 'slug or id required' }, { status: 400 });
  }

  // TMDB numeric ID — build player URL directly (no content DB lookup needed)
  const numericId = Number(id || slug);
  if (Number.isFinite(numericId) && numericId > 0) {
    let iframeUrl: string;
    let provider: string;

    if (isCompatiblePlayerConfigured()) {
      // Use the configured provider (e.g. Videasy via COMPATIBLE_PLAYER_BASE_URL)
      const built = mediaType === 'tv'
        ? buildCompatibleTvPlayerUrl(numericId, season, episode)
        : buildCompatibleMoviePlayerUrl(numericId);

      if (!built) {
        return NextResponse.json({ error: 'Player not configured' }, { status: 503 });
      }
      iframeUrl = built;
      provider = 'Videasy';
    } else {
      // Fallback: vidlink.pro works without any env var configuration
      iframeUrl = mediaType === 'tv'
        ? buildFallbackTvUrl(numericId, season, episode)
        : buildFallbackMovieUrl(numericId);
      provider = 'VidLink';
    }

    return NextResponse.json({
      iframe_url: iframeUrl,
      stream_url: null,
      source_type: 'iframe',
      playback_mode: 'iframe',
      provider,
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
