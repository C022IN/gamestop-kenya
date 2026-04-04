'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Bell,
  Copy,
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
import { useContinueWatching } from '@/hooks/useContinueWatching';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

interface MoviesHubClientProps {
  profileId: string;
  hasActive: boolean;
  playbackLocked: boolean;
  accessState: 'active' | 'expired' | 'none';
  subscriptionLabel?: string | null;
  subscriptionEndsLabel?: string | null;
  spotlightItems: MoviesHubTile[];
  sections: MoviesHubSection[];
  tvSetup?: {
    playlistUrl: string;
    xtreamHost: string;
    xtreamUsername: string;
    xtreamPassword: string;
  } | null;
}

function copyText(value: string) {
  void navigator.clipboard.writeText(value);
}

export default function MoviesHubClient({
  profileId,
  hasActive,
  playbackLocked,
  accessState,
  subscriptionLabel,
  subscriptionEndsLabel,
  spotlightItems,
  sections,
  tvSetup,
}: MoviesHubClientProps) {
  const { items: continueWatching } = useContinueWatching();
  const { items: recentlyViewed, remember } = useRecentlyViewed();
  const [selectedItem, setSelectedItem] = useState<MoviesHubTile | null>(null);

  const openQuickView = (item: MoviesHubTile) => {
    setSelectedItem(item);
  };

  const trackOpen = (item: MoviesHubTile) => {
    remember(item);
  };

  const subscriptionStatusText =
    accessState === 'active'
      ? subscriptionEndsLabel
        ? `Subscription active. Ends ${subscriptionEndsLabel}.`
        : 'Subscription active.'
      : accessState === 'expired'
        ? subscriptionEndsLabel
          ? `Subscription ended ${subscriptionEndsLabel}. Browse only until you renew.`
          : 'Subscription expired. Browse only until you renew.'
        : 'Browse-only mode. Sign in with an active plan to unlock playback.';
  const recentItems = recentlyViewed.filter(
    (item) => !continueWatching.some((entry) => entry.id === item.id)
  );

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
              <MoviesInlineSearch
                playbackLocked={playbackLocked}
                onOpenItem={trackOpen}
                onQuickView={openQuickView}
              />
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
          playbackLocked={playbackLocked}
          subscriptionLabel={subscriptionLabel}
          onOpenItem={trackOpen}
          onQuickView={openQuickView}
        />
      </section>

      <main className="relative z-10 -mt-28 px-4 pb-16 md:px-6 xl:px-8">
        <div className="mx-auto max-w-[1500px]">
          {playbackLocked ? (
            <section className="mt-8 rounded-[26px] border border-amber-200/10 bg-[#071121]/92 p-8 backdrop-blur-xl">
              <h2 className="text-3xl font-black text-white">
                {accessState === 'expired' ? 'Playback locked until you renew' : 'Unlock playback'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/64">
                {accessState === 'expired'
                  ? 'You can keep browsing the catalog, searching titles, and opening details pages, but playback stays disabled until the subscription is renewed.'
                  : 'Browse the catalog now, then sign in with an active plan to start playback.'}
              </p>
              <div className="mt-6">
                <Link href="/iptv">
                  <Button className="rounded-full bg-amber-300 px-6 py-6 font-bold text-slate-950 hover:bg-amber-200">
                    {accessState === 'expired' ? 'Renew plan' : 'View plans'}
                  </Button>
                </Link>
              </div>
            </section>
          ) : null}

          {tvSetup ? (
            <section className="mt-8 rounded-[26px] border border-sky-300/15 bg-[#071121]/92 p-6 backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                    TV setup / playlist details
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    Recover your player credentials anytime
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-white/64">
                    Use these in TiviMate, IPTV Smarters, Kodi, or VLC. The browser member hub stays available as your backup surface.
                  </p>
                </div>
                <Link href="/iptv">
                  <Button
                    variant="outline"
                    className="rounded-full border-sky-300/30 bg-transparent px-5 text-sky-100 hover:bg-sky-300/10"
                  >
                    Manage Plan
                  </Button>
                </Link>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Playlist', value: tvSetup.playlistUrl },
                  { label: 'Host', value: tvSetup.xtreamHost },
                  { label: 'Username', value: tvSetup.xtreamUsername },
                  { label: 'Password', value: tvSetup.xtreamPassword },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-[22px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-200/80">
                        {label}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyText(value)}
                        className="text-sky-200/70 transition hover:text-sky-100"
                        title={`Copy ${label}`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-2 break-all font-mono text-xs text-white/88">{value}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {continueWatching.length > 0 ? (
            <MoviesMediaRail
              section={{
                id: 'continue-watching',
                title: 'Continue Watching',
                items: continueWatching,
                eyebrow: 'Resume',
              }}
              playbackLocked={playbackLocked}
              onOpenItem={trackOpen}
              onQuickView={openQuickView}
            />
          ) : null}

          {recentItems.length > 0 ? (
            <MoviesMediaRail
              section={{
                id: 'recent',
                title: 'Recent',
                items: recentItems,
                eyebrow: 'Viewed',
              }}
              playbackLocked={playbackLocked}
              onOpenItem={trackOpen}
              onQuickView={openQuickView}
            />
          ) : null}

          {sections.map((section) => (
            <MoviesMediaRail
              key={section.id}
              section={section}
              playbackLocked={playbackLocked}
              onOpenItem={trackOpen}
              onQuickView={openQuickView}
            />
          ))}

          <section className="mt-10 flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-[#071121]/92 px-5 py-4 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-violet-300">
              <Radio className="h-5 w-5" />
            </div>
            <Link
              href={playbackLocked ? '/iptv' : '/live'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-violet-300/20 bg-violet-300/[0.08] text-violet-300 transition-colors hover:bg-violet-300/[0.14] hover:text-violet-200"
              title={playbackLocked ? 'Renew to restore live TV' : 'Open Live TV'}
              aria-label={playbackLocked ? 'Renew to restore live TV' : 'Open Live TV'}
            >
              <Radio className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </main>

      <QuickViewModal
        item={selectedItem}
        playbackLocked={playbackLocked}
        onClose={() => setSelectedItem(null)}
        onOpenItem={trackOpen}
      />
    </div>
  );
}
