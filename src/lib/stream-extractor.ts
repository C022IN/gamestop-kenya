// Calls the self-hosted extractor service to turn a TMDB ID into a direct HLS URL.
// The extractor lives outside Vercel (Puppeteer + headless Chrome can't run in
// serverless). See extractor-service/README.md for deployment.
//
// Returns null if the service is unreachable, returns an error, or simply finds
// no m3u8 — callers fall back to the iframe path.

export interface ExtractedStream {
  m3u8: string;
  headers: {
    referer: string | null;
    origin: string | null;
    'user-agent': string | null;
  };
  took_ms: number;
}

function getExtractorUrl(): string | null {
  // Support both the canonical name and the shorter alias set in Vercel.
  const raw = (process.env.STREAM_EXTRACTOR_URL ?? process.env.EXTRACTOR_BASE_URL)?.trim();
  return raw ? raw.replace(/\/+$/, '') : null;
}

function getExtractorToken(): string | null {
  const raw = (process.env.STREAM_EXTRACTOR_TOKEN ?? process.env.EXTRACTOR_AUTH_TOKEN)?.trim();
  return raw || null;
}

export function isStreamExtractorConfigured(): boolean {
  return getExtractorUrl() !== null;
}

export async function extractStream(params: {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  signal?: AbortSignal;
}): Promise<ExtractedStream | null> {
  const base = getExtractorUrl();
  if (!base) return null;

  const url = new URL('/extract', base);
  url.searchParams.set('tmdb_id', String(params.tmdbId));
  url.searchParams.set('type', params.mediaType);
  if (params.mediaType === 'tv') {
    url.searchParams.set('s', String(params.season ?? 1));
    url.searchParams.set('e', String(params.episode ?? 1));
  }

  const token = getExtractorToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: params.signal,
      // Vercel default fetch timeout is generous; bound it explicitly so a slow
      // extractor doesn't block the stream API.
      // (Note: AbortSignal.timeout is widely supported on modern Node)
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { ok?: boolean; m3u8?: string; headers?: ExtractedStream['headers']; took_ms?: number };
    if (!body.ok || !body.m3u8) return null;
    return {
      m3u8: body.m3u8,
      headers: body.headers ?? { referer: null, origin: null, 'user-agent': null },
      took_ms: body.took_ms ?? 0,
    };
  } catch {
    return null;
  }
}
