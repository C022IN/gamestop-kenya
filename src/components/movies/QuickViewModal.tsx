'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Info, Play, Star, X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { MoviesHubTile } from '@/components/movies/movie-hub-types';

interface QuickViewModalProps {
  item: MoviesHubTile | null;
  onClose: () => void;
  onOpenItem: (item: MoviesHubTile) => void;
}

export default function QuickViewModal({ item, onClose, onOpenItem }: QuickViewModalProps) {
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

  if (!item) {
    return null;
  }

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

            <div className="mt-auto flex flex-wrap gap-3 pt-8">
              <Button asChild className="h-12 rounded-xl bg-white px-5 font-bold text-black hover:bg-white/90">
                <Link href={item.href} onClick={() => onOpenItem(item)}>
                  {item.playable ? (
                    <Play className="mr-2 h-4 w-4" fill="currentColor" />
                  ) : (
                    <Info className="mr-2 h-4 w-4" />
                  )}
                  {item.ctaLabel ?? 'Open'}
                </Link>
              </Button>
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
