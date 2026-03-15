'use client';

import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Info, Play } from 'lucide-react';
import type { MoviesHubTile } from '@/components/movies/movie-hub-types';
import { PLAYER_PROGRESS_EVENT, useSeriesResume } from '@/hooks/useSeriesResume';

interface StoredProgress {
  timestamp?: number;
}

interface MediaPrimaryAction {
  hasResume: boolean;
  href: string;
  label: string;
  icon: LucideIcon;
  filledIcon: boolean;
  isSeries: boolean;
  isMovie: boolean;
  isPlayable: boolean;
}

function getMovieId(item: MoviesHubTile) {
  if (item.tmdbType !== 'movie') {
    return null;
  }

  const directMatch = item.id.match(/^movie-(\d+)$/);
  if (directMatch) {
    return Number(directMatch[1]);
  }

  const hrefMatch = item.href.match(/\/movies\/film\/movie-(\d+)/);
  return hrefMatch ? Number(hrefMatch[1]) : null;
}

function hasMovieResume(movieId: number) {
  try {
    const raw = window.localStorage.getItem(`gamestop:player-progress:movie-${movieId}`);
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw) as StoredProgress;
    return typeof parsed.timestamp === 'number' && parsed.timestamp > 0;
  } catch {
    return false;
  }
}

export function useMediaPrimaryAction(item: MoviesHubTile | null): MediaPrimaryAction {
  const seriesResume = useSeriesResume(item);
  const [movieHasResume, setMovieHasResume] = useState(false);
  const movieId = item ? getMovieId(item) : null;
  const isSeries = item?.tmdbType === 'tv';
  const isMovie = item?.tmdbType === 'movie';
  const isPlayable = Boolean(item?.playable) || isSeries || isMovie;

  useEffect(() => {
    if (!movieId) {
      setMovieHasResume(false);
      return;
    }

    const refresh = () => {
      setMovieHasResume(hasMovieResume(movieId));
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
  }, [movieId]);

  if (!item) {
    return {
      hasResume: false,
      href: '',
      label: 'Open',
      icon: Info,
      filledIcon: false,
      isSeries: false,
      isMovie: false,
      isPlayable: false,
    };
  }

  if (isSeries) {
    return {
      hasResume: seriesResume.hasResume,
      href: seriesResume.primaryHref,
      label: seriesResume.primaryLabel,
      icon: Play,
      filledIcon: true,
      isSeries: true,
      isMovie: false,
      isPlayable: true,
    };
  }

  if (isMovie) {
    return {
      hasResume: movieHasResume,
      href: `${item.href}?play=1#player`,
      label: movieHasResume ? 'Resume' : 'Play',
      icon: Play,
      filledIcon: true,
      isSeries: false,
      isMovie: true,
      isPlayable: true,
    };
  }

  if (item.playable) {
    return {
      hasResume: false,
      href: item.href,
      label: 'Play',
      icon: Play,
      filledIcon: true,
      isSeries: false,
      isMovie: false,
      isPlayable: true,
    };
  }

  return {
    hasResume: false,
    href: item.href,
    label: item.ctaLabel ?? 'Open',
    icon: Info,
    filledIcon: false,
    isSeries: false,
    isMovie: false,
    isPlayable: false,
  };
}
