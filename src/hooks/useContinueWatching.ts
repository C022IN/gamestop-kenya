'use client';

import { useEffect, useState } from 'react';
import type { MoviesHubTile } from '@/components/movies/movie-hub-types';
import { PLAYER_PROGRESS_EVENT } from '@/hooks/useSeriesResume';

const STORAGE_KEY = 'gamestop.movies.continue-watching';
const MAX_ITEMS = 12;

interface ContinueWatchingRecord {
  item: MoviesHubTile;
  storageKey: string;
  timestamp: number;
  progress?: number;
  duration?: number;
  updatedAt: string;
}

interface StoredProgressSnapshot {
  timestamp?: number;
  progress?: number;
  duration?: number;
  updatedAt?: string;
}

function readRecords(): ContinueWatchingRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (record): record is ContinueWatchingRecord =>
          Boolean(record?.item?.id) &&
          typeof record?.storageKey === 'string' &&
          typeof record?.timestamp === 'number' &&
          record.timestamp > 0
      )
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function writeRecords(records: ContinueWatchingRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_ITEMS)));
  window.dispatchEvent(new CustomEvent(PLAYER_PROGRESS_EVENT));
}

function isCompleted(progress: StoredProgressSnapshot) {
  if (typeof progress.progress === 'number' && progress.progress >= 0.92) {
    return true;
  }

  if (
    typeof progress.timestamp === 'number' &&
    typeof progress.duration === 'number' &&
    progress.duration > 0 &&
    progress.timestamp / progress.duration >= 0.92
  ) {
    return true;
  }

  return false;
}

export function upsertContinueWatchingItem(
  item: MoviesHubTile,
  storageKey: string,
  progress: StoredProgressSnapshot
) {
  if (typeof window === 'undefined' || typeof progress.timestamp !== 'number' || progress.timestamp <= 0) {
    return;
  }

  const current = readRecords();
  const next = current.filter((record) => record.item.id !== item.id);

  if (!isCompleted(progress)) {
    next.unshift({
      item,
      storageKey,
      timestamp: progress.timestamp,
      progress: progress.progress,
      duration: progress.duration,
      updatedAt: progress.updatedAt ?? new Date().toISOString(),
    });
  }

  writeRecords(next);
}

export function removeContinueWatchingItem(itemId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const next = readRecords().filter((record) => record.item.id !== itemId);
  writeRecords(next);
}

export function useContinueWatching() {
  const [items, setItems] = useState<MoviesHubTile[]>([]);

  useEffect(() => {
    const refresh = () => {
      setItems(readRecords().map((record) => record.item));
    };

    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener(PLAYER_PROGRESS_EVENT, refresh as EventListener);

    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener(PLAYER_PROGRESS_EVENT, refresh as EventListener);
    };
  }, []);

  return { items };
}
