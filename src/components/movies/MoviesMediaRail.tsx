'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Info, Star, Tv2 } from 'lucide-react';
import type { MoviesHubSection, MoviesHubTile } from '@/components/movies/movie-hub-types';
import { useCarouselControls } from '@/hooks/useCarouselControls';
import { useHoverPreview } from '@/hooks/useHoverPreview';
import { useMediaPrimaryAction } from '@/hooks/useMediaPrimaryAction';

interface MoviesMediaRailProps {
  section: MoviesHubSection;
  playbackLocked: boolean;
  onOpenItem: (item: MoviesHubTile) => void;
  onQuickView: (item: MoviesHubTile) => void;
}

function RailCard({
  item,
  accent,
  playbackLocked,
  previewActive,
  previewEnabled,
  onOpenItem,
  onQuickView,
  onPreviewStart,
  onPreviewEnd,
}: {
  item: MoviesHubTile;
  accent?: string;
  playbackLocked: boolean;
  previewActive: boolean;
  previewEnabled: boolean;
  onOpenItem: (item: MoviesHubTile) => void;
  onQuickView: (item: MoviesHubTile) => void;
  onPreviewStart: () => void;
  onPreviewEnd: () => void;
}) {
  const primaryAction = useMediaPrimaryAction(item, { playbackLocked });
  const PrimaryIcon = primaryAction.icon;
  const previewAttributes = [
    item.maturityRating ?? item.secondaryMeta ?? item.meta,
    item.genres[0],
  ].filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index);

  return (
    <article
      data-rail-card
      className="group relative block min-w-[280px] shrink-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#071121] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_60px_-34px_rgba(34,211,238,0.25)] md:min-w-[320px]"
      onMouseEnter={onPreviewStart}
      onMouseLeave={onPreviewEnd}
    >
      <Link
        href={item.href}
        className="absolute inset-0 z-10"
        aria-label={`Open ${item.title}`}
        onClick={() => onOpenItem(item)}
      />

      <div className="relative aspect-[16/9]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 280px, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.22),transparent_28%),linear-gradient(180deg,#091120_0%,#040814_100%)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/18 to-transparent" />
        <div
          className={`absolute inset-0 ${accent ?? 'bg-transparent'} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        />

        <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {typeof item.rank === 'number' ? (
              <span className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white">
                #{item.rank}
              </span>
            ) : null}
            {item.badge ? (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-black">
                {item.badge}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
              {item.meta ?? 'Featured'}
            </span>
            <button
              type="button"
              onClick={() => onQuickView(item)}
              className="relative z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white/82 transition-colors hover:bg-black/70 hover:text-white"
              aria-label={`Quick view ${item.title}`}
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
          <p className="line-clamp-2 text-lg font-black text-white md:text-xl">{item.title}</p>
          <span
            title={primaryAction.label}
            className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white/88 backdrop-blur-sm"
          >
            <PrimaryIcon
              className="h-4 w-4"
              {...(primaryAction.filledIcon ? { fill: 'currentColor' } : {})}
            />
          </span>
        </div>

        <div
          className={`absolute inset-0 z-30 hidden bg-[linear-gradient(180deg,rgba(4,8,20,0.2)_0%,rgba(4,8,20,0.84)_46%,rgba(4,8,20,0.98)_100%)] p-4 transition-all duration-300 md:block ${
            previewEnabled && previewActive ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/62">
              <span>{item.kindLabel ?? item.meta ?? 'Title'}</span>
              {typeof item.rating === 'number' ? (
                <span className="inline-flex items-center gap-1 text-amber-200">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {item.rating.toFixed(1)}
                </span>
              ) : null}
            </div>

            <h3 className="mt-3 text-xl font-black text-white">{item.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/72">
              {item.description?.trim() || 'Open this title to view more details.'}
            </p>

            <div className="mt-auto pt-4">
              <div className="flex items-center gap-2">
                <Link
                  href={primaryAction.href}
                  onClick={() => onOpenItem(item)}
                  title={primaryAction.label}
                  aria-label={primaryAction.label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-white/90"
                >
                  <PrimaryIcon
                    className="h-4 w-4"
                    {...(primaryAction.filledIcon ? { fill: 'currentColor' } : {})}
                  />
                </Link>
                {primaryAction.isSeries ? (
                  <Link
                    href={item.href}
                    onClick={() => onOpenItem(item)}
                    title="Choose episodes"
                    aria-label="Choose episodes"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white transition-colors hover:bg-white/[0.12]"
                  >
                    <Tv2 className="h-4 w-4" />
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => onQuickView(item)}
                  title="Quick view"
                  aria-label={`Quick view ${item.title}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white transition-colors hover:bg-white/[0.12]"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 min-h-[1rem]">
                {primaryAction.hasResume ? (
                  <span className="rounded-full border border-cyan-400/16 bg-cyan-400/[0.1] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100">
                    {primaryAction.label}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {previewAttributes.slice(0, 2).map((attribute) => (
                  <span
                    key={`${item.id}-${attribute}`}
                    className="rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70"
                  >
                    {attribute}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MoviesMediaRail({
  section,
  playbackLocked,
  onOpenItem,
  onQuickView,
}: MoviesMediaRailProps) {
  const { railRef, canScrollLeft, canScrollRight, scrollByCard } = useCarouselControls();
  const hoverPreview = useHoverPreview();

  if (section.items.length === 0) {
    return null;
  }

  return (
    <section id={section.id} className="mt-8 scroll-mt-24">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          {section.eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">
              {section.eyebrow}
            </p>
          ) : null}
          <h2 className="text-[1.75rem] font-black tracking-tight text-white">{section.title}</h2>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollByCard('left')}
          aria-label={`Scroll ${section.title} left`}
          className={`absolute left-2 top-1/2 z-40 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-[#071121]/92 text-white shadow-[0_18px_40px_-26px_rgba(0,0,0,0.85)] transition-all duration-200 md:inline-flex ${
            canScrollLeft ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div ref={railRef} className="flex gap-4 overflow-x-auto pb-3 pr-1 scrollbar-hide">
          {section.items.map((item) => (
            <RailCard
              key={item.id}
              item={item}
              accent={section.accent}
              playbackLocked={playbackLocked}
              previewActive={hoverPreview.activeId === item.id}
              previewEnabled={hoverPreview.enabled}
              onOpenItem={onOpenItem}
              onQuickView={onQuickView}
              onPreviewStart={() => hoverPreview.open(item.id)}
              onPreviewEnd={hoverPreview.close}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByCard('right')}
          aria-label={`Scroll ${section.title} right`}
          className={`absolute right-2 top-1/2 z-40 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-[#071121]/92 text-white shadow-[0_18px_40px_-26px_rgba(0,0,0,0.85)] transition-all duration-200 md:inline-flex ${
            canScrollRight ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
