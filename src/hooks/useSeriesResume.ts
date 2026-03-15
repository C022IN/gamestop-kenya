'use client';

import { useEffect, useState } from 'react';
import type { MoviesHubTile } from '@/components/movies/movie-hub-types';

export const PLAYER_PROGRESS_EVENT = 'gamestop:player-progress-updated';

interface StoredProgress {
  timestamp?: number;
  updatedAt?: string;
}

interface ResumeMatch {
  seasonNumber: number;
  episodeNumber: number;
}

function getSeriesId(item: MoviesHubTile) {
  if (item.tmdbType !== 'tv') {
    return null;
  }

  const directMatch = item.id.match(/^tv-(\d+)$/);
  if (directMatch) {
    return Number(directMatch[1]);
  }

  const hrefMatch = item.href.match(/\/movies\/film\/tv-(\d+)/);
  return hrefMatch ? Number(hrefMatch[1]) : null;
}

function formatResumeLabel(seasonNumber: number, episodeNumber: number) {
  if (seasonNumber > 1) {
    return `Resume S${seasonNumber} E${episodeNumber}`;
  }

  return `Resume Ep ${episodeNumber}`;
}

function buildEpisodeHref(href: string, seasonNumber: number, episodeNumber: number) {
  return `${href}?play=1&season=${seasonNumber}&episode=${episodeNumber}#player`;
}

function readResumeMatch(showId: number): ResumeMatch | null {
  const prefix = `gamestop:player-progress:tv-${showId}-s`;
  let bestMatch: (ResumeMatch & { updatedAtScore: number }) | null = null;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(prefix)) {
      continue;
    }

    const match = key.match(/^gamestop:player-progress:tv-\d+-s(\d+)-e(\d+)$/);
    if (!match) {
      continue;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const stored = JSON.parse(raw) as StoredProgress;
      if (typeof stored.timestamp !== 'number' || stored.timestamp <= 0) {
        continue;
      }

      const updatedAtScore = stored.updatedAt ? Date.parse(stored.updatedAt) || 0 : 0;
      const seasonNumber = Number(match[1]);
      const episodeNumber = Number(match[2]);

      if (
        !bestMatch ||
        updatedAtScore > bestMatch.updatedAtScore ||
        (updatedAtScore === bestMatch.updatedAtScore &&
          (seasonNumber > bestMatch.seasonNumber ||
            (seasonNumber === bestMatch.seasonNumber && episodeNumber > bestMatch.episodeNumber)))
      ) {
        bestMatch = {
          seasonNumber,
          episodeNumber,
          updatedAtScore,
        };
      }
    } catch {
      continue;
    }
  }

  if (!bestMatch) {
    return null;
  }

  return {
    seasonNumber: bestMatch.seasonNumber,
    episodeNumber: bestMatch.episodeNumber,
  };
}

export function useSeriesResume(item: MoviesHubTile | null) {
  const [resumeMatch, setResumeMatch] = useState<ResumeMatch | null>(null);
  const seriesId = item ? getSeriesId(item) : null;

  useEffect(() => {
    if (!seriesId) {
      setResumeMatch(null);
      return;
    }

    const refresh = () => {
      setResumeMatch(readResumeMatch(seriesId));
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
  }, [seriesId]);

  if (!item || !seriesId || item.tmdbType !== 'tv') {
    return {
      hasResume: false,
      primaryHref: item?.href ?? '',
      primaryLabel: item?.ctaLabel ?? 'Open',
      resumeSeasonNumber: null,
      resumeEpisodeNumber: null,
    };
  }

  if (!resumeMatch) {
    return {
      hasResume: false,
      primaryHref: buildEpisodeHref(item.href, 1, 1),
      primaryLabel: 'Play',
      resumeSeasonNumber: null,
      resumeEpisodeNumber: null,
    };
  }

  return {
    hasResume: true,
    primaryHref: buildEpisodeHref(item.href, resumeMatch.seasonNumber, resumeMatch.episodeNumber),
    primaryLabel: formatResumeLabel(resumeMatch.seasonNumber, resumeMatch.episodeNumber),
    resumeSeasonNumber: resumeMatch.seasonNumber,
    resumeEpisodeNumber: resumeMatch.episodeNumber,
  };
}
