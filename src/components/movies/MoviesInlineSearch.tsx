'use client';

import Link from 'next/link';
import { LoaderCircle, Search, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MoviesHubTile } from '@/components/movies/movie-hub-types';
import { Button } from '@/components/ui/button';

interface MoviesInlineSearchProps {
  onOpenItem: (item: MoviesHubTile) => void;
  onQuickView: (item: MoviesHubTile) => void;
}

interface SearchResponse {
  libraryResults: MoviesHubTile[];
  tmdbResults: MoviesHubTile[];
}

function SearchResultRow({
  item,
  onOpenItem,
  onQuickView,
}: {
  item: MoviesHubTile;
  onOpenItem: (item: MoviesHubTile) => void;
  onQuickView: (item: MoviesHubTile) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]">
      <div className="min-w-0 flex-1">
        <Link
          href={item.href}
          onClick={() => onOpenItem(item)}
          className="block min-w-0"
        >
          <p className="truncate text-sm font-bold text-white">{item.title}</p>
          <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-white/46">
            {item.kindLabel ?? item.meta ?? 'Title'}
          </p>
        </Link>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => onQuickView(item)}
        className="h-8 rounded-full border-white/10 bg-white/[0.04] px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-white/[0.1]"
      >
        <Sparkles className="mr-1 h-3.5 w-3.5" />
        View
      </Button>
    </div>
  );
}

export default function MoviesInlineSearch({
  onOpenItem,
  onQuickView,
}: MoviesInlineSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse>({ libraryResults: [], tmdbResults: [] });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!isOpen || trimmedQuery.length < 2) {
      setIsLoading(false);
      setResults({ libraryResults: [], tmdbResults: [] });
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/movies/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = (await response.json()) as SearchResponse;
        setResults({
          libraryResults: data.libraryResults ?? [],
          tmdbResults: data.tmdbResults ?? [],
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setResults({ libraryResults: [], tmdbResults: [] });
        }
      } finally {
        setIsLoading(false);
      }
    }, 240);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isOpen, query]);

  const totalResults = results.libraryResults.length + results.tmdbResults.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white/80 transition-colors hover:bg-black/40 hover:text-white"
        aria-label="Search titles"
        aria-expanded={isOpen}
      >
        <Search className="h-4 w-4" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-40 mt-3 w-[min(88vw,480px)] rounded-[24px] border border-white/10 bg-[#071121]/96 p-4 shadow-[0_30px_100px_-40px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Titles, people, genres"
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/28 px-11 pr-11 text-sm text-white outline-none transition-colors placeholder:text-white/36 focus:border-cyan-300/40"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.06] text-white/62 transition-colors hover:bg-white/[0.12] hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="mt-4 min-h-[120px]">
            {query.trim().length < 2 ? (
              <p className="text-sm text-white/52">Start typing to search movies, series, live TV, and sports.</p>
            ) : isLoading ? (
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200/78">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Searching
              </div>
            ) : totalResults === 0 ? (
              <p className="text-sm text-white/52">No matches.</p>
            ) : (
              <div className="space-y-4">
                {results.libraryResults.length > 0 ? (
                  <section>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">
                      GameStop Library
                    </p>
                    <div className="space-y-2">
                      {results.libraryResults.map((item) => (
                        <SearchResultRow
                          key={item.id}
                          item={item}
                          onOpenItem={(nextItem) => {
                            onOpenItem(nextItem);
                            setIsOpen(false);
                          }}
                          onQuickView={onQuickView}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                {results.tmdbResults.length > 0 ? (
                  <section>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">
                      TMDB Discovery
                    </p>
                    <div className="space-y-2">
                      {results.tmdbResults.map((item) => (
                        <SearchResultRow
                          key={item.id}
                          item={item}
                          onOpenItem={(nextItem) => {
                            onOpenItem(nextItem);
                            setIsOpen(false);
                          }}
                          onQuickView={onQuickView}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
