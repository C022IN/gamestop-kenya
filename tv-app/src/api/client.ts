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
}

const FALLBACK_PLAYER = 'https://vidlink.pro';

export function buildDirectPlayerUrl(
  id: string | number,
  mediaType: string,
  season = 1,
  episode = 1,
): string {
  const numId = Number(id);
  if (mediaType === 'tv') {
    return `${FALLBACK_PLAYER}/tv/${numId}/${season}/${episode}?autoplay=true&nextbutton=true&multiLang=true`;
  }
  return `${FALLBACK_PLAYER}/movie/${numId}?autoplay=true&multiLang=true`;
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
