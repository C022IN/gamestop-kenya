'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TmdbItem } from '@/lib/tmdb';

/* ── types ─────────────────────────────────────────────────── */

interface TmdbRailItem extends TmdbItem {
  _mediaType: 'movie' | 'tv';
}

interface Rail {
  title: string;
  emoji: string;
  action: string;
  type?: string;
}

const RAILS: Rail[] = [
  { title: 'Trending This Week',    emoji: '🔥', action: 'trending', type: 'all'   },
  { title: 'Popular Movies',        emoji: '🎬', action: 'popular',  type: 'movie' },
  { title: 'Top Rated Movies',      emoji: '⭐', action: 'top_rated', type: 'movie' },
  { title: 'Popular TV Shows',      emoji: '📺', action: 'popular',  type: 'tv'    },
  { title: 'Top Rated TV Shows',    emoji: '🏆', action: 'top_rated', type: 'tv'   },
];

/* ── helpers ────────────────────────────────────────────────── */

function posterUrl(path: string | null, size = 'w342') {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

function detailHref(item: TmdbRailItem) {
  const type = item.media_type === 'tv' ? 'tv' : item.media_type === 'movie' ? 'movie' : item._mediaType;
  return `/movies/film/${type}-${item.id}`;
}

/* ── Card ───────────────────────────────────────────────────── */

function TmdbCard({ item }: { item: TmdbRailItem }) {
  const title = item.title ?? item.name ?? 'Untitled';
  const imgSrc = posterUrl(item.poster_path);
  const rating = item.vote_average.toFixed(1);
  const href = detailHref(item);

  return (
    <Link href={href} className="group relative flex-none w-36 md:w-44 xl:w-48 overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all hover:border-violet-500/60 hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.25)]">
      <div className="relative aspect-[2/3] w-full bg-white/5">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={title}
            fill
            sizes="(max-width:768px) 144px, 192px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/20 text-xs px-2 text-center">
            {title}
          </div>
        )}
        {/* overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600/90 shadow-lg">
            <Play className="h-5 w-5 text-white" fill="white" />
          </div>
        </div>
      </div>
      <div className="p-2.5">
        <p className="truncate text-xs font-semibold text-white">{title}</p>
        <div className="mt-1 flex items-center gap-1">
          <Star className="h-3 w-3 text-amber-400" fill="currentColor" />
          <span className="text-[11px] text-white/60">{rating}</span>
        </div>
      </div>
    </Link>
  );
}

/* ── Rail ───────────────────────────────────────────────────── */

function TmdbRail({ rail }: { rail: Rail }) {
  const [items, setItems] = useState<TmdbRailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams({ action: rail.action });
    if (rail.type) params.set('type', rail.type);
    fetch(`/api/tmdb?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        const results: TmdbItem[] = data?.results ?? [];
        const typed: TmdbRailItem[] = results.map((item) => ({
          ...item,
          _mediaType: rail.type === 'tv' ? 'tv' : 'movie',
        }));
        setItems(typed);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [rail.action, rail.type]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-white md:text-2xl">
          {rail.emoji} {rail.title}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll('right')} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-none w-36 md:w-44 xl:w-48 aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {items.map((item) => (
            <TmdbCard key={`${item.id}-${item._mediaType}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Root ───────────────────────────────────────────────────── */

export default function TmdbBrowse() {
  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-bold uppercase tracking-widest text-white/30">TMDB · Movies & TV</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      {RAILS.map((rail) => (
        <TmdbRail key={`${rail.action}-${rail.type}`} rail={rail} />
      ))}
    </div>
  );
}
