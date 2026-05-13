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

// Primary fallback: multiembed.mov aggregates 10+ video servers, works in
// Android WebView without WebView-detection blocking, uses TMDB IDs directly.
// Secondary: vidlink.pro as an additional option if primary is down.
function buildPrimaryMovieUrl(tmdbId: number): string {
  return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
}

function buildPrimaryTvUrl(tmdbId: number, season: number, episode: number): string {
  return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
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
      // Prefer the operator-configured provider (e.g. Videasy)
      const built = mediaType === 'tv'
        ? buildCompatibleTvPlayerUrl(numericId, season, episode)
        : buildCompatibleMoviePlayerUrl(numericId);

      if (!built) {
        return NextResponse.json({ error: 'Player not configured' }, { status: 503 });
      }
      iframeUrl = built;
      provider = 'Videasy';
    } else {
      // No env var configured — use multiembed.mov (10+ servers, Android WebView friendly)
      iframeUrl = mediaType === 'tv'
        ? buildPrimaryTvUrl(numericId, season, episode)
        : buildPrimaryMovieUrl(numericId);
      provider = 'MultiEmbed';
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
