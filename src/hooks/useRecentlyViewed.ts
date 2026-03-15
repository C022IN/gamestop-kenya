'use client';

import { useEffect, useState } from 'react';
import type { MoviesHubTile } from '@/components/movies/movie-hub-types';

const STORAGE_KEY = 'gamestop.movies.recently-viewed';
const MAX_ITEMS = 12;

export function useRecentlyViewed() {
  const [items, setItems] = useState<MoviesHubTile[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return;
      }

      setItems(parsed as MoviesHubTile[]);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const remember = (item: MoviesHubTile) => {
    setItems((current) => {
      const next = [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, MAX_ITEMS);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return {
    items,
    remember,
  };
}
