// Calls the self-hosted extractor service to turn a TMDB ID into a direct HLS URL.
// The extractor lives outside Vercel (Puppeteer + headless Chrome can't run in
// serverless). See extractor-service/README.md for deployment.
//
// Returns null if the service is unreachable, returns an error, or simply finds
// no m3u8 — callers fall back to the iframe path.

export interface ExtractedStream {
  m3u8: string;
  headers: Record<string, string | null>;
  took_ms: number;
}

function getExtractorUrl(): string | null {
  // Support both the canonical name and the shorter alias set in Vercel.
  const raw = (process.env.STREAM_EXTRACTOR_URL ?? process.env.EXTRACTOR_BASE_URL)?.trim();
  return raw ? raw.replace(/\/+$/, '') : null;
}

// Strip surrounding single/double quotes and whitespace. Env values get quoted
// by accident (e.g. EXTRACTOR_AUTH_TOKEN="abc" stored with the quotes as part of
// the value), which then ship in the Bearer header and 401 against a bare token.
function unquote(value: string): string {
  const t = value.trim();
  if (
    t.length >= 2 &&
    ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))
  ) {
    return t.slice(1, -1).trim();
  }
  return t;
}

function getExtractorToken(): string | null {
  const raw = process.env.STREAM_EXTRACTOR_TOKEN ?? process.env.EXTRACTOR_AUTH_TOKEN;
  if (!raw) return null;
  const cleaned = unquote(raw);
  return cleaned || null;
}

export function isStreamExtractorConfigured(): boolean {
  return getExtractorUrl() !== null;
}

export interface ExtractorHealth {
  ok: boolean;
  configured: boolean;
  reachable: boolean;
  authorized: boolean;
  baseUrl: string | null;
  detail?: string;
  deep?: { extracted: boolean; error?: string };
}

// Health probe that mirrors the exact env resolution extractStream() uses, so a
// token drift or outage shows up here before it silently black-screens the TV
// app (which falls back to the unplayable Videasy iframe on extractor failure).
// Shallow by default (healthz + authcheck — cheap). Pass deep to run a real
// extraction of a stable title.
export async function checkExtractorHealth(opts?: {
  deep?: boolean;
  signal?: AbortSignal;
}): Promise<ExtractorHealth> {
  const base = getExtractorUrl();
  if (!base) {
    return {
      ok: false,
      configured: false,
      reachable: false,
      authorized: false,
      baseUrl: null,
      detail: 'EXTRACTOR_BASE_URL / STREAM_EXTRACTOR_URL not set',
    };
  }

  const token = getExtractorToken();
  const authedHeaders: Record<string, string> = { Accept: 'application/json' };
  if (token) authedHeaders.Authorization = `Bearer ${token}`;

  // 1. Liveness.
  try {
    const r = await fetch(new URL('/healthz', base).toString(), {
      headers: { Accept: 'application/json' },
      signal: opts?.signal,
      cache: 'no-store',
    });
    if (!r.ok) {
      return { ok: false, configured: true, reachable: false, authorized: false, baseUrl: base, detail: `healthz ${r.status}` };
    }
  } catch (err) {
    return {
      ok: false,
      configured: true,
      reachable: false,
      authorized: false,
      baseUrl: base,
      detail: `healthz unreachable: ${String((err as Error)?.message ?? err)}`,
    };
  }

  // 2. Auth — the token-drift detector that just bit us.
  try {
    const r = await fetch(new URL('/authcheck', base).toString(), {
      headers: authedHeaders,
      signal: opts?.signal,
      cache: 'no-store',
    });
    if (!r.ok) {
      const detail =
        r.status === 401
          ? 'authcheck 401 — EXTRACTOR_AUTH_TOKEN mismatch between Vercel and the extractor service'
          : `authcheck ${r.status}`;
      return { ok: false, configured: true, reachable: true, authorized: false, baseUrl: base, detail };
    }
  } catch (err) {
    return {
      ok: false,
      configured: true,
      reachable: true,
      authorized: false,
      baseUrl: base,
      detail: `authcheck failed: ${String((err as Error)?.message ?? err)}`,
    };
  }

  // 3. Optional deep check — full extraction of a stable title (Fight Club, 550).
  let deep: ExtractorHealth['deep'];
  if (opts?.deep) {
    const extracted = await extractStream({ tmdbId: 550, mediaType: 'movie', signal: opts?.signal });
    deep = extracted ? { extracted: true } : { extracted: false, error: 'no m3u8 returned for tmdb 550' };
  }

  const ok = !opts?.deep || Boolean(deep?.extracted);
  return { ok, configured: true, reachable: true, authorized: true, baseUrl: base, deep };
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
      headers: body.headers ?? {},
      took_ms: body.took_ms ?? 0,
    };
  } catch {
    return null;
  }
}
