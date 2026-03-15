'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Info, Play, Star, Tv2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { MoviesHubTile } from '@/components/movies/movie-hub-types';
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

function hasDirectMoviePlayback(item: MoviesHubTile) {
  return item.tmdbType === 'movie';
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

export default function QuickViewModal({ item, onClose, onOpenItem }: QuickViewModalProps) {
  const seriesResume = useSeriesResume(item);
  const [seasons, setSeasons] = useState<TmdbSeasonSummary[]>([]);
  const [episodes, setEpisodes] = useState<TmdbEpisodeDetails[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(false);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const seriesItem = item ? hasEpisodePicker(item) : false;
  const showId = getSeriesTmdbId(item);

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

    void fetch(`/api/tmdb?action=details&type=tv&id=${showId}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load series details');
        }

        return (await response.json()) as { seasons?: TmdbSeasonSummary[] };
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        const nextSeasons = [...(data.seasons ?? [])]
          .filter((season) => season.episode_count > 0)
          .sort((left, right) => left.season_number - right.season_number);

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

    void fetch(`/api/tmdb?action=season&id=${showId}&season=${selectedSeason}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load episodes');
        }

        return (await response.json()) as TmdbSeasonDetails;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        const nextEpisodes = data.episodes ?? [];
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

  const movieItem = hasDirectMoviePlayback(item);
  const primaryHref = seriesItem
    ? buildEpisodeHref(item.href, selectedSeason, selectedEpisode)
    : movieItem
      ? `${item.href}?play=1#player`
      : item.href;
  const isSelectedResume =
    seriesItem &&
    seriesResume.hasResume &&
    selectedSeason === seriesResume.resumeSeasonNumber &&
    selectedEpisode === seriesResume.resumeEpisodeNumber;
  const primaryLabel = seriesItem
    ? isSelectedResume
      ? seriesResume.primaryLabel
      : 'Play'
    : movieItem || item.playable
      ? 'Play'
      : item.ctaLabel ?? 'Open';
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

      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#071121] shadow-[0_40px_120px_-32px_rgba(2,12,27,0.95)]">
        <button
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
              {item.genres.slice(0, 4).map((genre) => (
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

            <div className="mt-6 grid gap-3 text-sm text-white/70 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Source
                </p>
                <p className="mt-2 font-semibold text-white/82">
                  {item.source === 'tmdb' ? 'TMDB Discovery' : 'GameStop Library'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Type
                </p>
                <p className="mt-2 font-semibold text-white/82">
                  {item.kindLabel ?? item.tmdbType?.toUpperCase() ?? 'Title'}
                </p>
              </div>
            </div>

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
              <Button asChild className="h-12 rounded-xl bg-white px-5 font-bold text-black hover:bg-white/90">
                <Link href={primaryHref} onClick={() => onOpenItem(item)}>
                  {seriesItem || movieItem || item.playable ? (
                    <Play className="mr-2 h-4 w-4" fill="currentColor" />
                  ) : (
                    <Info className="mr-2 h-4 w-4" />
                  )}
                  {primaryLabel}
                </Link>
              </Button>
              {seriesItem ? (
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-xl border-white/12 bg-white/[0.06] px-5 font-bold text-white hover:bg-white/[0.12]"
                >
                  <Link href={openSeriesHref} onClick={() => onOpenItem(item)}>
                    Open Series
                  </Link>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-12 rounded-xl border-white/12 bg-white/[0.06] px-5 font-bold text-white hover:bg-white/[0.12]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
