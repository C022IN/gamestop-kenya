import { NextRequest, NextResponse } from 'next/server';
import { MOVIE_SESSION_COOKIE, getSessionByToken } from '@/lib/movie-platform';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export interface ResumeEntry {
  tmdbId: string;
  mediaType: 'movie' | 'tv';
  season: number;
  episode: number;
  positionMs: number;
  durationMs?: number | null;
  title?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  updatedAt: string;
}

// GET /api/movies/resume — all resume entries for this profile, newest first
export async function GET(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const session = await getSessionByToken(token);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ items: [] });

  const { data, error } = await supabase
    .from('movie_resume_positions')
    .select('tmdb_id, media_type, season, episode, position_ms, duration_ms, title, poster_url, backdrop_url, updated_at')
    .eq('profile_id', session.profileId)
    .order('updated_at', { ascending: false })
    .limit(30);

  if (error || !data) return NextResponse.json({ items: [] });

  const items: ResumeEntry[] = data.map((r: any) => ({
    tmdbId: r.tmdb_id,
    mediaType: r.media_type,
    season: r.season,
    episode: r.episode,
    positionMs: r.position_ms,
    durationMs: r.duration_ms ?? null,
    title: r.title ?? null,
    posterUrl: r.poster_url ?? null,
    backdropUrl: r.backdrop_url ?? null,
    updatedAt: r.updated_at,
  }));

  return NextResponse.json({ items });
}

// POST /api/movies/resume — upsert a single resume entry
export async function POST(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const session = await getSessionByToken(token);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  let body: Partial<ResumeEntry>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { tmdbId, mediaType, positionMs } = body;
  if (!tmdbId || !mediaType || positionMs == null) {
    return NextResponse.json({ error: 'tmdbId, mediaType, positionMs required' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: true }); // graceful no-op without DB

  const now = new Date().toISOString();
  const { error } = await supabase.from('movie_resume_positions').upsert(
    {
      profile_id:  session.profileId,
      tmdb_id:     tmdbId,
      media_type:  mediaType,
      season:      body.season  ?? 0,
      episode:     body.episode ?? 0,
      position_ms: positionMs,
      duration_ms: body.durationMs ?? null,
      title:       body.title       ?? null,
      poster_url:  body.posterUrl   ?? null,
      backdrop_url: body.backdropUrl ?? null,
      updated_at:  now,
    },
    { onConflict: 'profile_id,tmdb_id,media_type,season,episode' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/movies/resume?tmdbId=X&mediaType=Y&season=Z&episode=W
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const session = await getSessionByToken(token);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const tmdbId    = p.get('tmdbId');
  const mediaType = p.get('mediaType');
  const season    = Number(p.get('season')  ?? 0);
  const episode   = Number(p.get('episode') ?? 0);

  if (!tmdbId || !mediaType) {
    return NextResponse.json({ error: 'tmdbId and mediaType required' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: true });

  await supabase
    .from('movie_resume_positions')
    .delete()
    .eq('profile_id', session.profileId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .eq('season', season)
    .eq('episode', episode);

  return NextResponse.json({ ok: true });
}
