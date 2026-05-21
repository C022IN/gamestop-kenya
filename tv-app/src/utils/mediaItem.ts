// Shared helpers for the union type AnyItem = CatalogItem | TmdbItem.
// Previously duplicated verbatim in HomeScreen, DetailScreen, PlayerScreen,
// HeroBanner, MovieRow, and SearchScreen.

import { tmdbPoster, tmdbBackdrop } from '@/api/client';
import type { CatalogItem, TmdbItem } from '@/api/client';

export type AnyItem = CatalogItem | TmdbItem;

export function getId(item: AnyItem): string {
  return String(item.id ?? '');
}

export function getNumericId(item: AnyItem): number | null {
  const n = Number(item.id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function getTitle(item: AnyItem): string {
  if ('title' in item && item.title) return item.title;
  if ('name' in item && (item as TmdbItem).name) return (item as TmdbItem).name!;
  return 'Unknown';
}

export function getOverview(item: AnyItem): string {
  return ('overview' in item ? item.overview : '') ?? '';
}

export function getMediaType(item: AnyItem): 'movie' | 'tv' {
  if ('media_type' in item && (item as TmdbItem).media_type === 'tv') return 'tv';
  if ('kind' in item && (item as CatalogItem).kind === 'series') return 'tv';
  return 'movie';
}

export function getSlug(item: AnyItem): string {
  return ('slug' in item && item.slug) ? item.slug : '';
}

export function getPosterUrl(item: AnyItem): string {
  if ('poster_url' in item && (item as any).poster_url) return (item as any).poster_url;
  if ('poster_path' in item) return tmdbPoster((item as TmdbItem).poster_path);
  return '';
}

export function getBackdropUrl(item: AnyItem): string {
  if ('backdrop_url' in item && (item as any).backdrop_url) return (item as any).backdrop_url;
  if ('backdrop_path' in item) return tmdbBackdrop((item as TmdbItem).backdrop_path);
  return '';
}

export function getSubtitle(item: AnyItem): string | undefined {
  const v = (item as any).vote_average;
  return v ? `★ ${Number(v).toFixed(1)}` : undefined;
}

/** Format seconds → m:ss or h:mm:ss */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/** Format milliseconds → "Xh Ym" or "Ym" */
export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  if (totalMin <= 0) return '';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
