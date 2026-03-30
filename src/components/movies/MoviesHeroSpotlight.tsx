'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clapperboard, Info, ShieldCheck, Star, Tv2, UserRound } from 'lucide-react';
import type { MoviesHubTile } from '@/components/movies/movie-hub-types';
import { useMediaPrimaryAction } from '@/hooks/useMediaPrimaryAction';
import { useHeroRotation } from '@/hooks/useHeroRotation';

interface MoviesHeroSpotlightProps {
  items: MoviesHubTile[];
  profileId: string;
  playbackLocked: boolean;
  subscriptionLabel?: string | null;
  onOpenItem: (item: MoviesHubTile) => void;
  onQuickView: (item: MoviesHubTile) => void;
}

const FALLBACK_ITEM: MoviesHubTile = {
  id: 'fallback-hero',
  title: 'GameStop IPTV',
  href: '/live',
  ctaLabel: 'Open',
  playable: false,
  description: 'Live TV, sports, series, and movies in one hub.',
  genres: ['Movies', 'Series', 'Live TV'],
  source: 'catalog',
};

export default function MoviesHeroSpotlight({
  items,
  profileId,
  playbackLocked,
  subscriptionLabel,
  onOpenItem,
  onQuickView,
}: MoviesHeroSpotlightProps) {
  const heroItems = items.length > 0 ? items : [FALLBACK_ITEM];
  const { activeIndex, goNext, goPrev, goTo } = useHeroRotation(heroItems.length);
  const activeItem = heroItems[activeIndex] ?? FALLBACK_ITEM;
  const primaryAction = useMediaPrimaryAction(activeItem, { playbackLocked });
  const PrimaryIcon = primaryAction.icon;

  return (
    <>
      <div className="absolute inset-0">
        {heroItems.map((item, index) => {
          const imageUrl = item.heroImageUrl ?? item.imageUrl;

          return (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === activeIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={item.title}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_28%),linear-gradient(180deg,#040814_0%,#060d1d_54%,#040814_100%)]" />
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,8,20,0.92)_0%,rgba(4,8,20,0.68)_38%,rgba(4,8,20,0.22)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,20,0.18)_0%,rgba(4,8,20,0.05)_48%,#040814_100%)]" />

      <div className="relative z-10 mx-auto flex max-w-[1500px] items-end px-4 pb-24 pt-12 md:px-6 lg:min-h-[68vh] lg:pb-32 xl:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.38em] text-cyan-200/82">
            {activeItem.source === 'tmdb' ? 'TMDB spotlight' : 'GameStop IPTV'}
          </p>
          <h1 className="mt-4 text-5xl font-black leading-[0.95] text-white md:text-7xl xl:text-8xl">
            {activeItem.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">
            {activeItem.description?.trim() || 'Live TV, sports, series, and movies in one hub.'}
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold text-white/75">
            {activeItem.genres.slice(0, 3).map((genre) => (
              <span key={`${activeItem.id}-${genre}`} className="rounded-full bg-black/30 px-3 py-1">
                {genre}
              </span>
            ))}
            {typeof activeItem.rating === 'number' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1 text-amber-200">
                <Star className="h-4 w-4 fill-current" />
                {activeItem.rating.toFixed(1)}
              </span>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={primaryAction.href}
              onClick={() => onOpenItem(activeItem)}
              title={primaryAction.label}
              aria-label={primaryAction.label}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-white/90"
            >
              <PrimaryIcon
                className="h-5 w-5"
                {...(primaryAction.filledIcon ? { fill: 'currentColor' } : {})}
              />
            </Link>
            {primaryAction.isSeries ? (
              <Link
                href={activeItem.href}
                onClick={() => onOpenItem(activeItem)}
                title="Choose episodes"
                aria-label="Choose episodes"
                className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/15 text-white transition-colors hover:bg-white/25"
              >
                <Tv2 className="h-5 w-5" />
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => onQuickView(activeItem)}
              title="Quick view"
              aria-label={`Quick view ${activeItem.title}`}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/15 text-white transition-colors hover:bg-white/25"
            >
              <Info className="h-5 w-5" />
            </button>
          </div>

          {playbackLocked ? (
            <p className="mt-4 text-sm font-semibold text-amber-200/82">
              Browse titles freely. Renew your plan to restore playback.
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-white/72">
            <span
              title={`Profile ${profileId}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/30"
            >
              <UserRound className="h-4 w-4" />
            </span>
            {subscriptionLabel ? (
              <span
                title={subscriptionLabel}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/30"
              >
                <ShieldCheck className="h-4 w-4" />
              </span>
            ) : null}
            <span
              title="Curated spotlight"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/30"
            >
              <Clapperboard className="h-4 w-4" />
            </span>
          </div>
        </div>

        {heroItems.length > 1 ? (
          <div className="ml-auto hidden items-end gap-3 lg:flex">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-2 py-2 backdrop-blur-sm">
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white/82 transition-colors hover:bg-white/16 hover:text-white"
                aria-label="Previous spotlight"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white/82 transition-colors hover:bg-white/16 hover:text-white"
                aria-label="Next spotlight"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-3 backdrop-blur-sm">
              {heroItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Show ${item.title}`}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/35 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
