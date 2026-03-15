'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Clapperboard,
  LoaderCircle,
  Search,
  Sparkles,
  Tv2,
  X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import QuickViewModal from '@/components/movies/QuickViewModal';
import type { MoviesHubTile } from '@/components/movies/movie-hub-types';
import { Button } from '@/components/ui/button';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import type { MoviesSearchFilter } from '@/lib/movie-hub';

interface MoviesSearchClientProps {
  profileId: string;
  initialQuery: string;
  filter: MoviesSearchFilter;
  libraryResults: MoviesHubTile[];
  tmdbResults: MoviesHubTile[];
  suggestedResults: MoviesHubTile[];
}

const FILTERS: Array<{ value: MoviesSearchFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'Series' },
  { value: 'live', label: 'Live TV' },
  { value: 'sports', label: 'Sports' },
];

function buildSearchHref(pathname: string, query: string, filter: MoviesSearchFilter) {
  const params = new URLSearchParams();
  const trimmedQuery = query.trim();

  if (trimmedQuery) {
    params.set('q', trimmedQuery);
  }

  if (filter !== 'all') {
    params.set('type', filter);
  }

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

function SearchResultCard({
  item,
  onOpenItem,
  onQuickView,
}: {
  item: MoviesHubTile;
  onOpenItem: (item: MoviesHubTile) => void;
  onQuickView: (item: MoviesHubTile) => void;
}) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-white/10 bg-[#071121]">
      <div className="relative aspect-[16/9] overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.2),transparent_26%),linear-gradient(180deg,#091120_0%,#040814_100%)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/18 to-transparent" />
        <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {item.badge ? (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-black">
                {item.badge}
              </span>
            ) : null}
            {item.rank ? (
              <span className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white">
                #{item.rank}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onQuickView(item)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white/82 transition-colors hover:bg-black/70 hover:text-white"
            aria-label={`Quick view ${item.title}`}
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
          <p className="line-clamp-2 text-xl font-black text-white">{item.title}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/64">
            {item.kindLabel ?? item.meta ?? 'Title'}
          </p>
        </div>
      </div>

      <div className="p-4">
        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-white/70">
          {item.description?.trim() || 'Open this title to view details and playback options.'}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.genres.slice(0, 3).map((genre) => (
            <span
              key={`${item.id}-${genre}`}
              className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/68"
            >
              {genre}
            </span>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <Button asChild className="h-10 flex-1 rounded-full bg-white font-bold text-black hover:bg-white/90">
            <Link href={item.href} onClick={() => onOpenItem(item)}>
              {item.ctaLabel ?? 'Open'}
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onQuickView(item)}
            className="h-10 rounded-full border-white/12 bg-white/[0.06] px-4 font-bold text-white hover:bg-white/[0.12]"
          >
            Quick View
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function MoviesSearchClient({
  profileId,
  initialQuery,
  filter,
  libraryResults,
  tmdbResults,
  suggestedResults,
}: MoviesSearchClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { remember } = useRecentlyViewed();
  const [selectedItem, setSelectedItem] = useState<MoviesHubTile | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const nextQuery = deferredQuery.trim();
    const currentQuery = initialQuery.trim();

    if (nextQuery === currentQuery) {
      return;
    }

    const timer = window.setTimeout(() => {
      startTransition(() => {
        router.replace(buildSearchHref(pathname, nextQuery, filter), { scroll: false });
      });
    }, 320);

    return () => window.clearTimeout(timer);
  }, [deferredQuery, filter, initialQuery, pathname, router]);

  const totalResults = libraryResults.length + tmdbResults.length;
  const hasQuery = initialQuery.trim().length > 0;
  const resultSummary = useMemo(() => {
    if (!hasQuery) {
      return 'Search movies, series, live TV, and sports.';
    }

    if (totalResults === 0) {
      return `No matches for "${initialQuery}".`;
    }

    return `${totalResults} result${totalResults === 1 ? '' : 's'} for "${initialQuery}".`;
  }, [hasQuery, initialQuery, totalResults]);

  const changeFilter = (nextFilter: MoviesSearchFilter) => {
    startTransition(() => {
      router.replace(buildSearchHref(pathname, query, nextFilter), { scroll: false });
    });
  };

  const submitQuery = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => {
      router.replace(buildSearchHref(pathname, query, filter), { scroll: false });
    });
  };

  const clearQuery = () => {
    setQuery('');
    startTransition(() => {
      router.replace(buildSearchHref(pathname, '', filter), { scroll: false });
    });
  };

  const openItem = (item: MoviesHubTile) => {
    remember(item);
  };

  return (
    <div className="min-h-screen bg-[#040814] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_26%),linear-gradient(180deg,#040814_0%,#060d1d_44%,#040814_100%)]" />

      <div className="relative">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#040814]/78 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 xl:px-8">
            <div className="flex items-center gap-3">
              <Link href="/movies" className="shrink-0">
                <BrandLogo size="sm" />
              </Link>
              <Link
                href="/movies"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/72 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to hub
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/64">
              <Clapperboard className="h-3.5 w-3.5" />
              Profile {profileId}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 pb-16 pt-8 md:px-6 xl:px-8">
          <section className="overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.14),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/78">
              <Search className="h-3.5 w-3.5" />
              Search
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white md:text-6xl">
              Find movies, series, live TV, and sports fast.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/64">{resultSummary}</p>

            <form onSubmit={submitQuery} className="mt-8">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/38" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search titles, genres, live channels..."
                    className="h-14 w-full rounded-2xl border border-white/10 bg-black/25 px-12 pr-12 text-base text-white outline-none transition-colors placeholder:text-white/34 focus:border-cyan-300/40"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={clearQuery}
                      className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.06] text-white/62 transition-colors hover:bg-white/[0.12] hover:text-white"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <Button type="submit" className="h-14 rounded-2xl bg-white px-8 text-base font-black text-black hover:bg-white/90">
                  Search
                </Button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => changeFilter(option.value)}
                  aria-pressed={filter === option.value}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                    filter === option.value
                      ? 'bg-white text-black'
                      : 'border border-white/10 bg-white/[0.04] text-white/72 hover:bg-white/[0.1]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {isPending ? (
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200/78">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Updating results
              </div>
            ) : null}
          </section>

          {!hasQuery ? (
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">
                    Quick picks
                  </p>
                  <h2 className="text-[1.75rem] font-black tracking-tight text-white">Start here</h2>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {suggestedResults.map((item) => (
                  <SearchResultCard
                    key={item.id}
                    item={item}
                    onOpenItem={openItem}
                    onQuickView={setSelectedItem}
                  />
                ))}
              </div>
            </section>
          ) : (
            <>
              {libraryResults.length > 0 ? (
                <section className="mt-8">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">
                        GameStop library
                      </p>
                      <h2 className="text-[1.75rem] font-black tracking-tight text-white">Local results</h2>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/32">
                      {libraryResults.length} titles
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {libraryResults.map((item) => (
                      <SearchResultCard
                        key={item.id}
                        item={item}
                        onOpenItem={openItem}
                        onQuickView={setSelectedItem}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {tmdbResults.length > 0 ? (
                <section className="mt-8">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">
                        TMDB discovery
                      </p>
                      <h2 className="text-[1.75rem] font-black tracking-tight text-white">More matches</h2>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/32">
                      {tmdbResults.length} titles
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {tmdbResults.map((item) => (
                      <SearchResultCard
                        key={item.id}
                        item={item}
                        onOpenItem={openItem}
                        onQuickView={setSelectedItem}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {totalResults === 0 ? (
                <section className="mt-8 rounded-[28px] border border-white/10 bg-[#071121]/92 p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white/82">
                      <Tv2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">No results</h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-white/62">
                        Try a shorter title, a genre, or switch the filter.
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}
            </>
          )}
        </main>
      </div>

      <QuickViewModal item={selectedItem} onClose={() => setSelectedItem(null)} onOpenItem={openItem} />
    </div>
  );
}
