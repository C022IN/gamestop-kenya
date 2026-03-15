'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Bell,
  ChevronRight,
  Radio,
  UserRound,
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import MoviesHeroSpotlight from '@/components/movies/MoviesHeroSpotlight';
import MoviesInlineSearch from '@/components/movies/MoviesInlineSearch';
import MoviesMediaRail from '@/components/movies/MoviesMediaRail';
import QuickViewModal from '@/components/movies/QuickViewModal';
import type { MoviesHubSection, MoviesHubTile } from '@/components/movies/movie-hub-types';
import { Button } from '@/components/ui/button';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

interface MoviesHubClientProps {
  profileId: string;
  hasActive: boolean;
  subscriptionLabel?: string | null;
  subscriptionEndsLabel?: string | null;
  spotlightItems: MoviesHubTile[];
  sections: MoviesHubSection[];
}

export default function MoviesHubClient({
  profileId,
  hasActive,
  subscriptionLabel,
  subscriptionEndsLabel,
  spotlightItems,
  sections,
}: MoviesHubClientProps) {
  const { items: recentlyViewed, remember } = useRecentlyViewed();
  const [selectedItem, setSelectedItem] = useState<MoviesHubTile | null>(null);

  const openQuickView = (item: MoviesHubTile) => {
    setSelectedItem(item);
  };

  const trackOpen = (item: MoviesHubTile) => {
    remember(item);
  };

  const subscriptionStatusText = hasActive
    ? subscriptionEndsLabel
      ? `Subscription active. Ends ${subscriptionEndsLabel}.`
      : 'Subscription active.'
    : 'Renew required.';

  return (
    <div className="min-h-screen bg-[#040814] text-white">
      <section className="relative min-h-[88vh] overflow-hidden">
        <header className="relative z-20">
          <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-4 md:px-6 xl:px-8">
            <Link href="/movies">
              <BrandLogo size="sm" />
            </Link>

            <nav className="hidden items-center gap-4 text-sm font-semibold text-white/88 lg:flex xl:gap-5 xl:text-[15px]">
              <Link href="/movies" className="hover:text-white">
                Home
              </Link>
              <Link href="#tv-shows" className="hover:text-white">
                TV Shows
              </Link>
              <Link href="#popular-movies" className="hover:text-white">
                Movies
              </Link>
              <Link href="/live" className="hover:text-white">
                Live TV
              </Link>
              <Link href="#sports" className="hover:text-white">
                Sports
              </Link>
              <Link href="#genre-animation" className="hover:text-white">
                Animation
              </Link>
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <MoviesInlineSearch onOpenItem={trackOpen} onQuickView={openQuickView} />
              <button
                type="button"
                className="hidden h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white/80 transition-colors hover:bg-black/40 hover:text-white md:inline-flex"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
              <div className="relative hidden md:block">
                <button
                  type="button"
                  title={subscriptionStatusText}
                  aria-label={subscriptionStatusText}
                  className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/25"
                >
                  <span
                    className={`h-3 w-3 rounded-full ${
                      hasActive ? 'bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]' : 'bg-amber-400'
                    }`}
                  />
                  <span className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-max max-w-[220px] rounded-xl border border-white/10 bg-[#071121]/96 px-3 py-2 text-left text-[11px] font-semibold leading-5 text-white/84 opacity-0 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.85)] transition-opacity duration-150 group-hover:opacity-100">
                    {subscriptionStatusText}
                    {subscriptionLabel ? <span className="block text-white/58">{subscriptionLabel}</span> : null}
                  </span>
                </button>
              </div>
              <Link
                href="/iptv"
                className="hidden h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white/90 transition-colors hover:bg-black/40 hover:text-white md:inline-flex"
                aria-label="Open profile and subscription"
                title="Open profile and subscription"
              >
                <UserRound className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        <MoviesHeroSpotlight
          items={spotlightItems}
          profileId={profileId}
          subscriptionLabel={subscriptionLabel}
          onOpenItem={trackOpen}
          onQuickView={openQuickView}
        />
      </section>

      <main className="relative z-10 -mt-28 px-4 pb-16 md:px-6 xl:px-8">
        <div className="mx-auto max-w-[1500px]">
          {!hasActive ? (
            <section className="mt-8 rounded-[26px] border border-amber-200/10 bg-[#071121]/92 p-8 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/78">
                Membership Required
              </p>
              <h2 className="mt-4 text-3xl font-black text-white">Renew to unlock playback</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/62">
                Discovery stays open, playback needs an active plan.
              </p>
              <div className="mt-6">
                <Link href="/iptv">
                  <Button className="rounded-full bg-amber-300 px-6 py-6 font-bold text-slate-950 hover:bg-amber-200">
                    View plans
                  </Button>
                </Link>
              </div>
            </section>
          ) : (
            <>
              {recentlyViewed.length > 0 ? (
                <MoviesMediaRail
                  section={{
                    id: 'recently-viewed',
                    title: 'Recently Viewed',
                    items: recentlyViewed,
                    eyebrow: 'Continue',
                  }}
                  onOpenItem={trackOpen}
                  onQuickView={openQuickView}
                />
              ) : null}

              {sections.map((section) => (
                <MoviesMediaRail
                  key={section.id}
                  section={section}
                  onOpenItem={trackOpen}
                  onQuickView={openQuickView}
                />
              ))}

              <section className="mt-10 flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-[#071121]/92 px-5 py-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Radio className="h-5 w-5 text-violet-300" />
                  <p className="text-sm font-semibold text-white/82">Need live TV? Open the live screen.</p>
                </div>
                <Link
                  href="/live"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-violet-300 transition-colors hover:text-violet-200"
                >
                  Open Live TV
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </section>
            </>
          )}
        </div>
      </main>

      <QuickViewModal item={selectedItem} onClose={() => setSelectedItem(null)} onOpenItem={trackOpen} />
    </div>
  );
}
