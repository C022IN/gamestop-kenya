'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Tv2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MoviesHubTile } from '@/components/movies/movie-hub-types';
import { useMediaPrimaryAction } from '@/hooks/useMediaPrimaryAction';
import { useSeriesResume } from '@/hooks/useSeriesResume';
import type { TmdbEpisodeDetails, TmdbSeasonDetails, TmdbSeasonSummary } from '@/lib/tmdb';

interface QuickViewModalProps {
  item: MoviesHubTile | null;
  onClose: () => void;
  onOpenItem: (item: MoviesHubTile) => void;
}

function hasEpisodePicker(item: MoviesHubTile) {
  return item.tmdbType === 'tv';
}

function getSeriesTmdbId(item: MoviesHubTile | null) {
  if (!item || item.tmdbType !== 'tv') {
    return null;
  }

  const directMatch = item.id.match(/^tv-(\d+)$/);
  if (directMatch) {
    return Number(directMatch[1]);
  }

  const hrefMatch = item.href.match(/\/movies\/film\/tv-(\d+)/);
  return hrefMatch ? Number(hrefMatch[1]) : null;
}

function buildEpisodeHref(href: string, seasonNumber: number, episodeNumber: number) {
  return `${href}?play=1&season=${seasonNumber}&episode=${episodeNumber}#player`;
}

const seriesCache = new Map<number, TmdbSeasonSummary[]>();
const seasonCache = new Map<string, TmdbEpisodeDetails[]>();

async function fetchSeriesSeasons(showId: number) {
  if (seriesCache.has(showId)) {
    return seriesCache.get(showId) ?? [];
  }

  const response = await fetch(`/api/tmdb?action=details&type=tv&id=${showId}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to load series details');
  }

  const data = (await response.json()) as { seasons?: TmdbSeasonSummary[] };
  const seasons = [...(data.seasons ?? [])]
    .filter((season) => season.episode_count > 0)
    .sort((left, right) => left.season_number - right.season_number);

  seriesCache.set(showId, seasons);
  return seasons;
}

async function fetchSeasonEpisodes(showId: number, seasonNumber: number) {
  const cacheKey = `${showId}:${seasonNumber}`;
  if (seasonCache.has(cacheKey)) {
    return seasonCache.get(cacheKey) ?? [];
  }

  const response = await fetch(`/api/tmdb?action=season&id=${showId}&season=${seasonNumber}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to load episodes');
  }

  const data = (await response.json()) as TmdbSeasonDetails;
  const episodes = data.episodes ?? [];
  seasonCache.set(cacheKey, episodes);
  return episodes;
}

export default function QuickViewModal({ item, onClose, onOpenItem }: QuickViewModalProps) {
  const seriesResume = useSeriesResume(item);
  const primaryAction = useMediaPrimaryAction(item);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [seasons, setSeasons] = useState<TmdbSeasonSummary[]>([]);
  const [episodes, setEpisodes] = useState<TmdbEpisodeDetails[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(false);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const seriesItem = item ? hasEpisodePicker(item) : false;
  const showId = getSeriesTmdbId(item);
  const PrimaryIcon = primaryAction.icon;

  useEffect(() => {
    if (!item) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    window.setTimeout(() => closeButtonRef.current?.focus(), 10);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, onClose]);

  useEffect(() => {
    if (!seriesItem || !showId) {
      setSeasons([]);
      setEpisodes([]);
      setSelectedSeason(1);
      setSelectedEpisode(1);
      return;
    }

    const fallbackSeason = seriesResume.resumeSeasonNumber ?? 1;
    const fallbackEpisode = seriesResume.resumeEpisodeNumber ?? 1;
    let cancelled = false;

    setIsLoadingSeasons(true);
    setSeasons([]);
    setEpisodes([]);
    setSelectedSeason(fallbackSeason);
    setSelectedEpisode(fallbackEpisode);

    void fetchSeriesSeasons(showId)
      .then((nextSeasons) => {
        if (cancelled) {
          return;
        }

        setSeasons(nextSeasons);

        const resolvedSeason =
          nextSeasons.find((season) => season.season_number === fallbackSeason)?.season_number ??
          nextSeasons[0]?.season_number ??
          1;

        setSelectedSeason(resolvedSeason);
        setSelectedEpisode(
          resolvedSeason === seriesResume.resumeSeasonNumber
            ? seriesResume.resumeEpisodeNumber ?? 1
            : 1
        );
      })
      .catch(() => {
        if (!cancelled) {
          setSeasons([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSeasons(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    item?.id,
    seriesItem,
    showId,
    seriesResume.resumeEpisodeNumber,
    seriesResume.resumeSeasonNumber,
  ]);

  useEffect(() => {
    if (!seriesItem || !showId || !selectedSeason) {
      setEpisodes([]);
      return;
    }

    let cancelled = false;
    setIsLoadingEpisodes(true);
    setEpisodes([]);

    void fetchSeasonEpisodes(showId, selectedSeason)
      .then((nextEpisodes) => {
        if (cancelled) {
          return;
        }

        setEpisodes(nextEpisodes);
        setSelectedEpisode((current) => {
          if (nextEpisodes.some((episode) => episode.episode_number === current)) {
            return current;
          }

          return nextEpisodes[0]?.episode_number ?? 1;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setEpisodes([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingEpisodes(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [seriesItem, showId, selectedSeason]);

  if (!item) {
    return null;
  }

  const primaryHref = seriesItem
    ? buildEpisodeHref(item.href, selectedSeason, selectedEpisode)
    : primaryAction.href;
  const isSelectedResume =
    seriesItem &&
    seriesResume.hasResume &&
    selectedSeason === seriesResume.resumeSeasonNumber &&
    selectedEpisode === seriesResume.resumeEpisodeNumber;
  const primaryLabel = seriesItem
    ? isSelectedResume
      ? seriesResume.primaryLabel
      : 'Play'
    : primaryAction.label;
  const openSeriesHref = seriesItem
    ? `${item.href}?season=${selectedSeason}&episode=${selectedEpisode}#episodes`
    : item.href;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-6 sm:px-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/72 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close quick view"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#071121] shadow-[0_40px_120px_-32px_rgba(2,12,27,0.95)]"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white/80 transition-colors hover:bg-black/65 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[260px] overflow-hidden sm:min-h-[360px]">
            {item.heroImageUrl || item.imageUrl ? (
              <Image
                src={item.heroImageUrl ?? item.imageUrl ?? ''}
                alt={item.title}
                fill
                sizes="(max-width: 1024px) 100vw, 56vw"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.2),transparent_24%),linear-gradient(180deg,#071121_0%,#040814_100%)]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#040814] via-[#040814]/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
                {item.kindLabel ? <span>{item.kindLabel}</span> : null}
                {item.meta ? <span>{item.meta}</span> : null}
                {typeof item.rating === 'number' ? (
                  <span className="inline-flex items-center gap-1 text-amber-200">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {item.rating.toFixed(1)}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">{item.title}</h2>
            </div>
          </div>

          <div className="flex flex-col p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              {item.badge ? (
                <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-black">
                  {item.badge}
                </span>
              ) : null}
              {item.genres.slice(0, 2).map((genre) => (
                <span
                  key={`${item.id}-${genre}`}
                  className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70"
                >
                  {genre}
                </span>
              ))}
            </div>

            <p className="mt-6 text-sm leading-7 text-white/72 sm:text-base">
              {item.description?.trim() || 'Open this title to view details and playback options.'}
            </p>

            {seriesItem ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Season
                  </span>
                  <select
                    value={selectedSeason}
                    onChange={(event) => {
                      const nextSeason = Number(event.target.value);
                      setSelectedSeason(nextSeason);
                      setSelectedEpisode(
                        nextSeason === seriesResume.resumeSeasonNumber
                          ? seriesResume.resumeEpisodeNumber ?? 1
                          : 1
                      );
                    }}
                    disabled={isLoadingSeasons || seasons.length === 0}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-3 font-semibold text-white outline-none transition-colors focus:border-cyan-300/60"
                  >
                    {isLoadingSeasons ? <option>Loading seasons...</option> : null}
                    {!isLoadingSeasons && seasons.length === 0 ? <option>Season 1</option> : null}
                    {seasons.map((season) => (
                      <option key={season.id} value={season.season_number}>
                        {season.name || `Season ${season.season_number}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Episode
                  </span>
                  <select
                    value={selectedEpisode}
                    onChange={(event) => setSelectedEpisode(Number(event.target.value))}
                    disabled={isLoadingEpisodes || episodes.length === 0}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-3 font-semibold text-white outline-none transition-colors focus:border-cyan-300/60"
                  >
                    {isLoadingEpisodes ? <option>Loading episodes...</option> : null}
                    {!isLoadingEpisodes && episodes.length === 0 ? <option>Episode 1</option> : null}
                    {episodes.map((episode) => (
                      <option key={episode.id} value={episode.episode_number}>
                        {`Ep ${episode.episode_number}${episode.name ? ` - ${episode.name}` : ''}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            <div className="mt-auto flex flex-wrap gap-3 pt-8">
              <Link
                href={primaryHref}
                onClick={() => onOpenItem(item)}
                title={primaryLabel}
                aria-label={primaryLabel}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-white/90"
              >
                <PrimaryIcon
                  className="h-4 w-4"
                  {...(primaryAction.filledIcon ? { fill: 'currentColor' } : {})}
                />
              </Link>
              {seriesItem ? (
                <Link
                  href={openSeriesHref}
                  onClick={() => onOpenItem(item)}
                  title="Open series"
                  aria-label="Open series"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white transition-colors hover:bg-white/[0.12]"
                >
                  <Tv2 className="h-4 w-4" />
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                title="Close"
                aria-label="Close"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white transition-colors hover:bg-white/[0.12]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
