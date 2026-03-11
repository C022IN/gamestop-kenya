import 'server-only';

const DEFAULT_TMDB_BASE = 'https://api.themoviedb.org/3';
const DEFAULT_TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
export type TmdbMediaType = 'movie' | 'tv';

function tmdbBase() {
  return process.env.TMDB_API_BASE_URL?.trim() || DEFAULT_TMDB_BASE;
}

export const TMDB_IMAGE_BASE =
  process.env.TMDB_IMAGE_BASE_URL?.trim() || DEFAULT_TMDB_IMAGE_BASE;

function apiKey() {
  return process.env.TMDB_API_KEY ?? '';
}

export function tmdbPoster(path: string | null | undefined, size: 'w185' | 'w342' | 'w500' | 'w780' = 'w342'): string {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function tmdbBackdrop(path: string | null | undefined, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids?: number[];
  media_type?: 'movie' | 'tv' | 'person';
}

export interface TmdbDetails extends TmdbItem {
  genres: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  status: string;
  tagline?: string;
}

export interface TmdbEpisodeDetails {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date?: string;
  episode_number: number;
  season_number: number;
  runtime?: number;
  vote_average: number;
}

export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  name: string;
  official: boolean;
}

export interface TmdbCastMember {
  name: string;
  character: string;
  profile_path: string | null;
}

interface TmdbFindResponse {
  movie_results: TmdbItem[];
  tv_results: TmdbItem[];
}

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const key = apiKey();
  const url = new URL(`${tmdbBase()}${path}`);
  if (key) {
    url.searchParams.set('api_key', key);
  }
  url.searchParams.set('language', process.env.TMDB_API_LANGUAGE?.trim() || 'en-US');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export const isTmdbConfigured = () =>
  Boolean(process.env.TMDB_API_BASE_URL?.trim() || process.env.TMDB_API_KEY?.trim());

export const getTrending = (mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') =>
  tmdbGet<{ results: TmdbItem[] }>(`/trending/${mediaType}/${timeWindow}`);

export const getPopular = (mediaType: 'movie' | 'tv') =>
  tmdbGet<{ results: TmdbItem[] }>(`/${mediaType}/popular`);

export const getTopRated = (mediaType: 'movie' | 'tv') =>
  tmdbGet<{ results: TmdbItem[] }>(`/${mediaType}/top_rated`);

export const discoverByGenre = (mediaType: 'movie' | 'tv', genreId: number) =>
  tmdbGet<{ results: TmdbItem[] }>(`/discover/${mediaType}`, {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
  });

export const getDetails = (mediaType: 'movie' | 'tv', id: number) =>
  tmdbGet<TmdbDetails>(`/${mediaType}/${id}`);

export const getEpisodeDetails = (seriesId: number, seasonNumber: number, episodeNumber: number) =>
  tmdbGet<TmdbEpisodeDetails>(
    `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`
  );

export const getVideos = (mediaType: 'movie' | 'tv', id: number) =>
  tmdbGet<{ results: TmdbVideo[] }>(`/${mediaType}/${id}/videos`);

export const getCredits = (mediaType: 'movie' | 'tv', id: number) =>
  tmdbGet<{ cast: TmdbCastMember[] }>(`/${mediaType}/${id}/credits`);

export const getSimilar = (mediaType: 'movie' | 'tv', id: number) =>
  tmdbGet<{ results: TmdbItem[] }>(`/${mediaType}/${id}/similar`);

export const searchMulti = (query: string) =>
  tmdbGet<{ results: TmdbItem[] }>('/search/multi', { query });

export async function findByImdbId(
  imdbId: string,
  preferredType?: TmdbMediaType
): Promise<{ mediaType: TmdbMediaType; item: TmdbItem } | null> {
  const data = await tmdbGet<TmdbFindResponse>(`/find/${encodeURIComponent(imdbId)}`, {
    external_source: 'imdb_id',
  });

  if (!data) {
    return null;
  }

  const movie = data.movie_results[0];
  const tv = data.tv_results[0];

  if (preferredType === 'movie' && movie) {
    return { mediaType: 'movie', item: movie };
  }

  if (preferredType === 'tv' && tv) {
    return { mediaType: 'tv', item: tv };
  }

  if (movie) {
    return { mediaType: 'movie', item: movie };
  }

  if (tv) {
    return { mediaType: 'tv', item: tv };
  }

  return null;
}
