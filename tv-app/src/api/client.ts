import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://www.gamestop.co.ke/api';
const SESSION_KEY = 'gsm_movie_session';
const PHONE_KEY = 'gsm_user_phone';

export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length >= 10) return '254' + digits.slice(1);
  if (digits.startsWith('254')) return digits;
  return digits;
}

async function headers(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem(SESSION_KEY);
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'GameStopMoviesTV/1.0',
    ...(token ? { Cookie: `gsm_movie_session=${token}` } : {}),
  };
}

function extractSessionCookie(response: Response): string | null {
  const cookie = response.headers.get('set-cookie') ?? '';
  const match = cookie.match(/gsm_movie_session=([^;]+)/);
  return match ? match[1] : null;
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_KEY);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
  await AsyncStorage.removeItem(PHONE_KEY);
}

export async function getStoredPhone(): Promise<string | null> {
  return AsyncStorage.getItem(PHONE_KEY);
}

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function login(phone: string, accessCode: string): Promise<LoginResult> {
  try {
    const res = await fetch(`${BASE_URL}/movies/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'GameStopMoviesTV/1.0' },
      body: JSON.stringify({ phone: normalisePhone(phone), accessCode: accessCode.toUpperCase() }),
    });
    const token = extractSessionCookie(res);
    const data = await res.json().catch(() => ({}));
    if (data.error) return { ok: false, error: data.error };
    if (!token) return { ok: false, error: 'No session token received' };
    await AsyncStorage.setItem(SESSION_KEY, token);
    // Store phone for display in HomeScreen
    const displayPhone = data.profile?.phone ?? normalisePhone(phone);
    await AsyncStorage.setItem(PHONE_KEY, displayPhone);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? 'Network error' };
  }
}

export interface CatalogItem {
  id: string;
  slug: string;
  title: string;
  overview?: string;
  poster_url?: string;
  backdrop_url?: string;
  year?: number;
  genres?: string[];
  kind?: string;
  duration_minutes?: number;
  maturity_rating?: string;
  vote_average?: number;
}

export interface CatalogResponse {
  items: CatalogItem[];
  sections?: Array<{ id: string; title: string; items: CatalogItem[] }>;
}

export async function fetchCatalog(): Promise<CatalogResponse | null> {
  try {
    const res = await fetch(`${BASE_URL}/movies/catalog/`, { headers: await headers() });
    if (res.status === 401) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface TmdbItem {
  id: string | number;
  slug?: string;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  media_type?: string;
}

export interface TmdbSection {
  id: string;
  title: string;
  items: TmdbItem[];
}

const TMDB_IMG = 'https://image.tmdb.org/t/p';

export function tmdbPoster(path: string | null | undefined): string {
  return path ? `${TMDB_IMG}/w342${path}` : '';
}

export function tmdbBackdrop(path: string | null | undefined): string {
  return path ? `${TMDB_IMG}/w780${path}` : '';
}

export interface StreamResult {
  stream_url?: string | null;
  iframe_url?: string;
  source_type?: string;
  playback_mode?: string;
  provider?: string;
  // HLS CDNs gate segment requests on a mix of Referer/Origin/User-Agent.
  // The extractor forwards whatever the inner page used so expo-av replays them.
  stream_headers?: Record<string, string | null | undefined>;
}

// Client-side last-resort fallback if the server API is unreachable.
// Mirrors the server default (Videasy). If you switch providers on the server,
// update this too.
export function buildDirectPlayerUrl(
  id: string | number,
  mediaType: string,
  season = 1,
  episode = 1,
): string {
  const numId = Number(id);
  if (mediaType === 'tv') {
    return `https://player.videasy.net/tv/${numId}/${season}/${episode}`;
  }
  return `https://player.videasy.net/movie/${numId}`;
}

export async function fetchStream(
  slug: string,
  id: string,
  mediaType?: string,
  season?: number,
  episode?: number,
): Promise<StreamResult | null> {
  try {
    const params = new URLSearchParams();
    if (slug) params.set('slug', slug);
    if (id) params.set('id', String(id));
    if (mediaType) params.set('media_type', mediaType);
    if (season) params.set('season', String(season));
    if (episode) params.set('episode', String(episode));
    const res = await fetch(`${BASE_URL}/movies/stream/?${params}`, { headers: await headers() });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface SearchResult {
  libraryResults: CatalogItem[];
  tmdbResults: TmdbItem[];
}

export async function searchMovies(query: string): Promise<SearchResult> {
  try {
    const res = await fetch(
      `${BASE_URL}/movies/search/?q=${encodeURIComponent(query)}`,
      { headers: await headers() },
    );
    if (!res.ok) return { libraryResults: [], tmdbResults: [] };
    return res.json();
  } catch {
    return { libraryResults: [], tmdbResults: [] };
  }
}

// ---- Episode list (Series) ---------------------------------------------------

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  still_url: string;
  air_date?: string;
  runtime?: number;
  vote_average: number;
}

export interface SeasonEpisodes {
  season_number: number;
  name: string;
  overview: string;
  episodes: Episode[];
}

export async function fetchEpisodes(tvId: number | string, season: number): Promise<SeasonEpisodes | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/movies/episodes/?tv_id=${tvId}&season=${season}`,
      { headers: await headers() },
    );
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ---- Full title details (genres, seasons summary, runtime) ------------------

export interface SeasonSummary {
  season_number: number;
  name: string;
  overview: string;
  episode_count: number;
  air_date?: string;
  poster_url: string;
}

export interface TitleDetails {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  overview: string;
  tagline?: string;
  runtime?: number;
  status?: string;
  vote_average: number;
  release_date?: string;
  poster_url: string;
  backdrop_url: string;
  genres: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: SeasonSummary[];
}

export async function fetchDetails(id: number | string, type: 'movie' | 'tv'): Promise<TitleDetails | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/movies/details/?id=${id}&type=${type}`,
      { headers: await headers() },
    );
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ---- Cast --------------------------------------------------------------------

export interface CastMember {
  name: string;
  character: string;
  profile_url: string;
}

export async function fetchCredits(id: number | string, type: 'movie' | 'tv'): Promise<CastMember[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/movies/credits/?id=${id}&type=${type}`,
      { headers: await headers() },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.cast ?? [];
  } catch { return []; }
}

// ---- Similar / Discover ------------------------------------------------------

export async function fetchSimilar(id: number | string, type: 'movie' | 'tv'): Promise<TmdbItem[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/movies/similar/?id=${id}&type=${type}`,
      { headers: await headers() },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch { return []; }
}

export async function fetchDiscover(type: 'movie' | 'tv', genreId: number): Promise<TmdbItem[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/movies/discover/?type=${type}&genre_id=${genreId}`,
      { headers: await headers() },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch { return []; }
}

// ---- Title Logo (transparent PNG for hero) ----------------------------------

export async function fetchTitleLogo(id: number | string, type: 'movie' | 'tv'): Promise<{ url: string; aspect: number } | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/movies/images/?id=${id}&type=${type}`,
      { headers: await headers() },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.logo_url) return null;
    return { url: data.logo_url, aspect: data.aspect ?? 2 };
  } catch { return null; }
}

// ---- Continue Watching (local) ----------------------------------------------

export interface ResumeEntry {
  id: string;            // tmdb id or slug
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  positionMs: number;
  updatedAt: number;
  // Title/poster hydrated from the most recent Detail/Player visit
  title?: string;
  posterUrl?: string;
  backdropUrl?: string;
}

const RESUME_INDEX_KEY = 'resume_index_v1';

export async function recordResume(entry: ResumeEntry): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(RESUME_INDEX_KEY);
    const arr: ResumeEntry[] = raw ? JSON.parse(raw) : [];
    const k = (e: ResumeEntry) =>
      `${e.id}_${e.mediaType}_${e.season ?? 0}_${e.episode ?? 0}`;
    const key = k(entry);
    const next = arr.filter(e => k(e) !== key);
    next.unshift({ ...entry, updatedAt: Date.now() });
    await AsyncStorage.setItem(RESUME_INDEX_KEY, JSON.stringify(next.slice(0, 30)));
  } catch { /* ignore */ }
}

export async function clearResume(id: string, mediaType: 'movie' | 'tv', season?: number, episode?: number): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(RESUME_INDEX_KEY);
    if (!raw) return;
    const arr: ResumeEntry[] = JSON.parse(raw);
    const next = arr.filter(e =>
      !(e.id === id && e.mediaType === mediaType && (e.season ?? 0) === (season ?? 0) && (e.episode ?? 0) === (episode ?? 0))
    );
    await AsyncStorage.setItem(RESUME_INDEX_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

export async function getContinueWatching(): Promise<ResumeEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(RESUME_INDEX_KEY);
    if (!raw) return [];
    const arr: ResumeEntry[] = JSON.parse(raw);
    return arr.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch { return []; }
}
