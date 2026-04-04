import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionByToken,
  getContentItemBySlug,
  canAccessContent,
  buildPlaybackSource,
  MOVIE_SESSION_COOKIE,
} from '@/lib/movie-platform';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const session = await getSessionByToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get('slug') ?? '';
  const id = req.nextUrl.searchParams.get('id') ?? '';

  if (!slug && !id) {
    return NextResponse.json({ error: 'slug or id required' }, { status: 400 });
  }

  const content = await getContentItemBySlug(slug || id);
  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  const hasAccess = await canAccessContent(session.profileId, content.id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'No active subscription for this content' }, { status: 403 });
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
    title: content.title,
    signed: source.signed,
  });
}
