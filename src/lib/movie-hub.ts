import type { MoviesHubTile } from '@/components/movies/movie-hub-types';
import {
  hasConfiguredPlayback,
  type IptvCatalogEntry,
  type IptvCatalogSections,
} from '@/lib/iptv-catalog';
import type { ResumePosition } from '@/lib/movie-platform';
import { tmdbBackdrop, tmdbPoster, type TmdbDetails, type TmdbItem } from '@/lib/tmdb';

export const MOVIE_HUB_LIMIT = 12;
export const MOVIE_HUB_TOP_10_LIMIT = 10;

export type TmdbHubType = 'movie' | 'tv';
export type MoviesSearchFilter = 'all' | 'movie' | 'series' | 'live' | 'sports';

const MOVIE_GENRES: Record<number, string> = {
  12: 'Adventure',
  14: 'Fantasy',
  16: 'Animation',
  18: 'Drama',
  27: 'Horror',
  28: 'Action',
  35: 'Comedy',
  53: 'Thriller',
  80: 'Crime',
  878: 'Sci-Fi',
  10751: 'Family',
};

const TV_GENRES: Record<number, string> = {
  16: 'Animation',
  18: 'Drama',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  10759: 'Action',
  10762: 'Kids',
  10765: 'Sci-Fi',
  10768: 'War',
};

export function take<T>(items: T[] | undefined, count = MOVIE_HUB_LIMIT) {
  return (items ?? []).slice(0, count);
}

export function truncate(value: string | undefined, max = 180) {
  const input = value?.trim() ?? '';
  if (!input) {
    return '';
  }

  return input.length > max ? `${input.slice(0, max).trimEnd()}...` : input;
}

export function tmdbTitle(item: TmdbItem) {
  return item.title ?? item.name ?? 'Untitled';
}

export function tmdbYear(item: TmdbItem) {
  const raw = item.release_date ?? item.first_air_date ?? '';
  return raw.slice(0, 4);
}

export function tmdbHref(item: TmdbItem, fallbackType: TmdbHubType) {
  const mediaType =
    item.media_type === 'tv' || item.media_type === 'movie' ? item.media_type : fallbackType;
  return `/movies/film/${mediaType}-${item.id}`;
}

export function tmdbGenres(item: TmdbItem, fallbackType: TmdbHubType) {
  const actualType =
    item.media_type === 'tv' || item.media_type === 'movie' ? item.media_type : fallbackType;
  const source = actualType === 'tv' ? TV_GENRES : MOVIE_GENRES;

  return (item.genre_ids ?? [])
    .map((genreId) => source[genreId])
    .filter((genre): genre is string => Boolean(genre))
    .slice(0, 4);
}

export function catalogKindLabel(item: IptvCatalogEntry) {
  if (item.kind === 'live_channel') {
    return 'Live TV';
  }
  if (item.kind === 'sports_event') {
    return 'Sports';
  }
  if (item.kind === 'series') {
    return 'Series';
  }
  if (item.kind === 'episode') {
    return 'Episode';
  }

  return 'Movie';
}

export function toTmdbTiles(
  items: TmdbItem[],
  fallbackType: TmdbHubType,
  limit = MOVIE_HUB_LIMIT,
  ranked = false
): MoviesHubTile[] {
  return take(
    items.filter(
      (item) =>
        item.media_type !== 'person' && (Boolean(item.backdrop_path) || Boolean(item.poster_path))
    ),
    limit
  ).map((item, index) => {
    const actualType =
      item.media_type === 'tv' || item.media_type === 'movie' ? item.media_type : fallbackType;

    return {
      id: `${actualType}-${item.id}`,
      title: tmdbTitle(item),
      imageUrl:
        tmdbBackdrop(item.backdrop_path, 'w1280') ||
        tmdbPoster(item.poster_path, 'w780') ||
        undefined,
      heroImageUrl:
        tmdbBackdrop(item.backdrop_path, 'original') ||
        tmdbPoster(item.poster_path, 'w780') ||
        undefined,
      href: tmdbHref(item, fallbackType),
      meta: tmdbYear(item) || (actualType === 'tv' ? 'Series' : 'Movie'),
      ctaLabel: actualType === 'tv' ? 'Episodes' : 'More Info',
      playable: false,
      description: truncate(item.overview, 220),
      genres: tmdbGenres(item, fallbackType),
      rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : undefined,
      source: 'tmdb',
      tmdbType: actualType,
      kindLabel: actualType === 'tv' ? 'Series' : 'Movie',
      secondaryMeta: tmdbYear(item) || undefined,
      rank: ranked ? index + 1 : undefined,
    };
  });
}

export function toTmdbDetailsTile(
  item: TmdbDetails,
  mediaType: TmdbHubType
): MoviesHubTile {
  return {
    id: `${mediaType}-${item.id}`,
    title: tmdbTitle(item),
    imageUrl:
      tmdbBackdrop(item.backdrop_path, 'w1280') ||
      tmdbPoster(item.poster_path, 'w780') ||
      undefined,
    heroImageUrl:
      tmdbBackdrop(item.backdrop_path, 'original') ||
      tmdbPoster(item.poster_path, 'w780') ||
      undefined,
    href: tmdbHref(item, mediaType),
    meta: tmdbYear(item) || (mediaType === 'tv' ? 'Series' : 'Movie'),
    ctaLabel: mediaType === 'tv' ? 'Episodes' : 'More Info',
    playable: false,
    description: truncate(item.overview, 220),
    genres: (item.genres ?? []).map((genre) => genre.name).slice(0, 4),
    rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : undefined,
    source: 'tmdb',
    tmdbType: mediaType,
    kindLabel: mediaType === 'tv' ? 'Series' : 'Movie',
    secondaryMeta: tmdbYear(item) || undefined,
  };
}

export function toCatalogTiles(items: IptvCatalogEntry[], limit = MOVIE_HUB_LIMIT): MoviesHubTile[] {
  return take(items, limit).map((item) => ({
    id: item.id,
    title: item.title,
    imageUrl: item.backdropUrl ?? item.posterUrl,
    heroImageUrl: item.backdropUrl ?? item.posterUrl,
    href: `/movies/watch/${item.slug}`,
    badge: item.badge,
    meta:
      item.kind === 'live_channel'
        ? 'Live TV'
        : item.kind === 'sports_event'
          ? item.liveEvent?.competition ?? 'Sports'
          : item.kind === 'series'
            ? 'Series'
            : item.releaseYear
              ? String(item.releaseYear)
              : undefined,
    ctaLabel: hasConfiguredPlayback(item) ? 'Play' : 'Open',
    playable: hasConfiguredPlayback(item),
    description: truncate(item.synopsis, 220),
    genres: item.genres.slice(0, 4),
    rating: item.voteAverage,
    source: 'catalog',
    kindLabel: catalogKindLabel(item),
    maturityRating: item.maturityRating,
    secondaryMeta:
      item.kind === 'sports_event'
        ? item.liveEvent?.competition
        : item.maturityRating ?? item.territory,
  }));
}

export function toResumeTiles(entries: ResumePosition[]): MoviesHubTile[] {
  return entries
    .filter(e => e.positionMs > 0)
    .map(e => {
      const pct = e.durationMs && e.durationMs > 0
        ? Math.min(100, Math.round((e.positionMs / e.durationMs) * 100))
        : null;
      const label = e.mediaType === 'tv' && e.season && e.episode
        ? `S${e.season} E${e.episode}`
        : e.mediaType === 'tv' ? 'TV' : 'Movie';
      return {
        id:           `${e.mediaType}-${e.tmdbId}`,
        title:        e.title ?? 'Unknown',
        imageUrl:     e.backdropUrl ?? e.posterUrl ?? undefined,
        heroImageUrl: e.backdropUrl ?? e.posterUrl ?? undefined,
        href:         `/movies/film/${e.mediaType}-${e.tmdbId}`,
        meta:         label,
        badge:        pct != null ? `${pct}%` : undefined,
        ctaLabel:     'Resume',
        playable:     false,
        genres:       [],
        source:       'tmdb' as const,
        tmdbType:     e.mediaType,
        kindLabel:    e.mediaType === 'tv' ? 'Series' : 'Movie',
        secondaryMeta: pct != null ? `${pct}% watched` : undefined,
      };
    });
}

export function uniqueTilesById(items: MoviesHubTile[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

export function flattenCatalogEntries(catalog: IptvCatalogSections) {
  const seen = new Set<string>();
  const allEntries = [
    ...catalog.featured,
    ...catalog.liveChannels,
    ...catalog.movies,
    ...catalog.series,
    ...catalog.sportsEvents,
  ];

  return allEntries.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function catalogSearchScore(item: IptvCatalogEntry, query: string) {
  const title = item.title.toLowerCase();
  const synopsis = item.synopsis.toLowerCase();
  const genres = item.genres.join(' ').toLowerCase();
  const badge = item.badge?.toLowerCase() ?? '';
  const competition = item.liveEvent?.competition?.toLowerCase() ?? '';

  let score = 0;

  if (title === query) {
    score += 120;
  } else if (title.startsWith(query)) {
    score += 95;
  } else if (title.includes(query)) {
    score += 75;
  }

  if (genres.includes(query)) {
    score += 36;
  }

  if (competition.includes(query)) {
    score += 32;
  }

  if (badge.includes(query)) {
    score += 18;
  }

  if (synopsis.includes(query)) {
    score += 16;
  }

  return score;
}

export function searchCatalogEntries(
  items: IptvCatalogEntry[],
  query: string,
  limit = 24
): IptvCatalogEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return items
    .map((item) => ({ item, score: catalogSearchScore(item, normalized) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.item.title.localeCompare(right.item.title);
    })
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function matchesSearchFilter(item: MoviesHubTile, filter: MoviesSearchFilter) {
  switch (filter) {
    case 'movie':
      return item.tmdbType === 'movie' || item.kindLabel === 'Movie' || item.kindLabel === 'Episode';
    case 'series':
      return item.tmdbType === 'tv' || item.kindLabel === 'Series';
    case 'live':
      return item.kindLabel === 'Live TV';
    case 'sports':
      return item.kindLabel === 'Sports';
    default:
      return true;
  }
}
