'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MoviesHubTile } from '@/components/movies/movie-hub-types';
import { upsertContinueWatchingItem } from '@/hooks/useContinueWatching';
import { PLAYER_PROGRESS_EVENT } from '@/hooks/useSeriesResume';

interface CompatiblePlayerFrameProps {
  src: string;
  title: string;
  playerOrigin?: string | null;
  storageKey: string;
  historyItem?: MoviesHubTile | null;
}

interface StoredProgress {
  progress?: number;
  timestamp?: number;
  duration?: number;
  updatedAt?: string;
}

function formatSeconds(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  }

  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

export default function CompatiblePlayerFrame({
  src,
  title,
  playerOrigin,
  storageKey,
  historyItem,
}: CompatiblePlayerFrameProps) {
  const localStorageKey = useMemo(() => `gamestop:player-progress:${storageKey}`, [storageKey]);
  const [iframeSrc, setIframeSrc] = useState(src);
  const [resumeTimestamp, setResumeTimestamp] = useState<number | null>(null);

  useEffect(() => {
    setIframeSrc(src);
    setResumeTimestamp(null);

    try {
      const raw = window.localStorage.getItem(localStorageKey);
      if (!raw) {
        return;
      }

      const stored = JSON.parse(raw) as StoredProgress;
      if (typeof stored.timestamp !== 'number' || stored.timestamp <= 0) {
        return;
      }

      const nextUrl = new URL(src);
      if (!nextUrl.searchParams.has('progress')) {
        nextUrl.searchParams.set('progress', String(Math.floor(stored.timestamp)));
        setIframeSrc(nextUrl.toString());
      }

      setResumeTimestamp(stored.timestamp);
    } catch {
      setIframeSrc(src);
    }
  }, [src, localStorageKey]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (playerOrigin && event.origin !== playerOrigin) {
        return;
      }

      if (typeof event.data !== 'string') {
        return;
      }

      try {
        const parsed = JSON.parse(event.data) as StoredProgress & {
          id?: string | number;
          type?: string;
          season?: number;
          episode?: number;
        };

        if (!parsed || typeof parsed !== 'object') {
          return;
        }

        const nextRecord = {
          progress: typeof parsed.progress === 'number' ? parsed.progress : undefined,
          timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : undefined,
          duration: typeof parsed.duration === 'number' ? parsed.duration : undefined,
          updatedAt: new Date().toISOString(),
        } satisfies StoredProgress;

        if (typeof nextRecord.timestamp === 'number' && nextRecord.timestamp > 0) {
          setResumeTimestamp(nextRecord.timestamp);
        }

        window.localStorage.setItem(localStorageKey, JSON.stringify(nextRecord));
        if (historyItem) {
          upsertContinueWatchingItem(historyItem, storageKey, nextRecord);
        }
        window.dispatchEvent(new CustomEvent(PLAYER_PROGRESS_EVENT, { detail: { storageKey } }));
      } catch {
        return;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [historyItem, localStorageKey, playerOrigin, storageKey]);

  return (
    <div>
      <div className="aspect-video overflow-hidden rounded-[26px] bg-black">
        <iframe
          src={iframeSrc}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
      {resumeTimestamp ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/46">
          Resume point detected at {formatSeconds(resumeTimestamp)}
        </p>
      ) : null}
    </div>
  );
}
