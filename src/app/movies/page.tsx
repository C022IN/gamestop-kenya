import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Bell,
  ChevronRight,
  Clapperboard,
  Info,
  Play,
  Radio,
  Search,
  Tv2,
  UserRound,
  Waves,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getIptvCatalogSections,
  hasConfiguredPlayback,
  type IptvCatalogEntry,
} from '@/lib/iptv-catalog';
import { getActiveSubscriptionsForProfile } from '@/lib/movie-platform';
import { getCurrentMovieMember } from '@/lib/movie-session';
import {
  discoverByGenre,
  getPopular,
  getTopRated,
  getTrending,
  tmdbBackdrop,
  type TmdbItem,
} from '@/lib/tmdb';

const RAIL_LIMIT = 12;

type TmdbRailType = 'movie' | 'tv';

interface MediaTile {
  id: string;
  title: string;
  imageUrl?: string;
  href: string;
  badge?: string;
  meta?: string;
  ctaLabel?: string;
  playable?: boolean;
}

function take<T>(items: T[] | undefined, count = RAIL_LIMIT) {
  return (items ?? []).slice(0, count);
}

function truncate(value: string | undefined, max = 180) {
  const input = value?.trim() ?? '';
  if (!input) {
    return '';
  }

  return input.length > max ? `${input.slice(0, max).trimEnd()}...` : input;
}

function tmdbTitle(item: TmdbItem) {
  return item.title ?? item.name ?? 'Untitled';
}

function tmdbYear(item: TmdbItem) {
  const raw = item.release_date ?? item.first_air_date ?? '';
  return raw.slice(0, 4);
}

function tmdbHref(item: TmdbItem, fallbackType: TmdbRailType) {
  const mediaType =
    item.media_type === 'tv' || item.media_type === 'movie' ? item.media_type : fallbackType;
  return `/movies/film/${mediaType}-${item.id}`;
}

function toTmdbTiles(items: TmdbItem[], fallbackType: TmdbRailType): MediaTile[] {
  return take(
    items.filter((item) => item.media_type !== 'person' && item.backdrop_path),
    RAIL_LIMIT
  ).map((item) => ({
    id: `${fallbackType}-${item.id}`,
    title: tmdbTitle(item),
    imageUrl: tmdbBackdrop(item.backdrop_path, 'w1280') || undefined,
    href: tmdbHref(item, fallbackType),
    meta: tmdbYear(item) || undefined,
    ctaLabel: 'More Info',
    playable: false,
  }));
}

function toCatalogTiles(items: IptvCatalogEntry[]): MediaTile[] {
  return take(items, RAIL_LIMIT).map((item) => ({
    id: item.id,
    title: item.title,
    imageUrl: item.backdropUrl ?? item.posterUrl,
    href: `/movies/watch/${item.slug}`,
    badge: item.badge,
    meta:
      item.kind === 'live_channel'
        ? 'Live TV'
        : item.kind === 'sports_event'
          ? item.liveEvent?.competition ?? 'Sports'
          : item.kind === 'series'
            ? 'Series'
            : item.releaseYear
              ? String(item.releaseYear)
              : undefined,
    ctaLabel: hasConfiguredPlayback(item) ? 'Play' : 'Open',
    playable: hasConfiguredPlayback(item),
  }));
}

function MediaRail({
  id,
  title,
  items,
  accent,
}: {
  id: string;
  title: string;
  items: MediaTile[];
  accent?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section id={id} className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-[1.75rem] font-black tracking-tight text-white">{title}</h2>
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/32">
          {items.length} titles
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group relative block min-w-[280px] shrink-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#071121] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_60px_-34px_rgba(34,211,238,0.25)] md:min-w-[320px]"
          >
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
              <div className={`absolute inset-0 ${accent ?? 'bg-transparent'} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

              <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
                {item.badge ? (
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-black">
                    {item.badge}
                  </span>
                ) : (
                  <span />
                )}

                <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
                  {item.meta ?? 'Featured'}
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="line-clamp-2 text-lg font-black text-white md:text-xl">{item.title}</p>
                <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/88 backdrop-blur-sm">
                  {item.playable ? (
                    <Play className="h-3.5 w-3.5" fill="currentColor" />
                  ) : (
                    <Info className="h-3.5 w-3.5" />
                  )}
                  {item.ctaLabel ?? 'Open'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function MoviesPage() {
  const memberState = await getCurrentMovieMember();
  if (!memberState) {
    redirect('/movies/login');
  }

  const { profile } = memberState;
  const [
    catalog,
    activeSubscriptions,
    trendingMovies,
    popularMovies,
    popularTv,
    topRatedMovies,
    animationMovies,
  ] = await Promise.all([
    getIptvCatalogSections(),
    getActiveSubscriptionsForProfile(profile.profileId),
    getTrending('movie'),
    getPopular('movie'),
    getPopular('tv'),
    getTopRated('movie'),
    discoverByGenre('movie', 16),
  ]);

  const hasActive = activeSubscriptions.length > 0;
  const primarySubscription = activeSubscriptions[0] ?? null;
  const heroSource =
    trendingMovies?.results.find((item) => item.backdrop_path)?.media_type !== 'person'
      ? trendingMovies?.results.find((item) => item.backdrop_path)
      : null;
  const hero = heroSource ?? popularMovies?.results.find((item) => item.backdrop_path) ?? null;

  const heroTitle = hero ? tmdbTitle(hero) : 'GameStop IPTV';
  const heroHref = hero ? tmdbHref(hero, 'movie') : '/live';
  const heroImage = hero ? tmdbBackdrop(hero.backdrop_path, 'original') : '';
  const heroDescription = hero
    ? truncate(hero.overview, 170)
    : 'Live TV, sports, series, and movie shelves built for fast browsing.';

  const featuredTiles = toCatalogTiles(catalog.featured);
  const sportsTiles = toCatalogTiles(catalog.sportsEvents);
  const liveTiles = toCatalogTiles(catalog.liveChannels);
  const movieTiles = toCatalogTiles(catalog.movies);
  const seriesTiles = toCatalogTiles(catalog.series);

  const trendingTiles = toTmdbTiles(trendingMovies?.results ?? [], 'movie');
  const popularMovieTiles = toTmdbTiles(popularMovies?.results ?? [], 'movie');
  const popularTvTiles = toTmdbTiles(popularTv?.results ?? [], 'tv');
  const topRatedTiles = toTmdbTiles(topRatedMovies?.results ?? [], 'movie');
  const animationTiles = toTmdbTiles(animationMovies?.results ?? [], 'movie');

  return (
    <div className="min-h-screen bg-[#040814] text-white">
      <section className="relative min-h-[88vh] overflow-hidden">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={heroTitle}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_28%),linear-gradient(180deg,#040814_0%,#060d1d_54%,#040814_100%)]" />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,8,20,0.9)_0%,rgba(4,8,20,0.6)_38%,rgba(4,8,20,0.2)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,20,0.12)_0%,rgba(4,8,20,0.05)_48%,#040814_100%)]" />

        <header className="relative z-20">
          <div className="mx-auto flex max-w-[1500px] items-center gap-6 px-4 py-6 md:px-6 xl:px-8">
            <Link href="/movies" className="text-2xl font-black tracking-[0.3em] text-white">
              GAMESTOP
            </Link>

            <nav className="hidden items-center gap-8 text-lg font-semibold text-white/90 lg:flex">
              <Link href="/movies" className="hover:text-white">Home</Link>
              <Link href="#tv-shows" className="hover:text-white">TV Shows</Link>
              <Link href="#movies" className="hover:text-white">Movies</Link>
              <Link href="/live" className="hover:text-white">Live TV</Link>
              <Link href="#sports" className="hover:text-white">Sports</Link>
              <Link href="#animation" className="hover:text-white">Animation</Link>
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white/80 transition-colors hover:bg-black/40 hover:text-white md:inline-flex"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white/80 transition-colors hover:bg-black/40 hover:text-white md:inline-flex"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>
              <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200 md:inline-flex">
                {hasActive ? 'Subscription active' : 'Renew required'}
              </span>
              <Link href="/iptv">
                <Button className="rounded-full bg-violet-600 px-5 text-sm font-semibold hover:bg-violet-500">
                  Manage
                </Button>
              </Link>
              <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white/90 lg:flex">
                <UserRound className="h-5 w-5" />
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex max-w-[1500px] items-end px-4 pb-24 pt-12 md:px-6 lg:min-h-[68vh] lg:pb-32 xl:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.38em] text-cyan-200/82">
              {hero ? 'TMDB spotlight' : 'GameStop IPTV'}
            </p>
            <h1 className="mt-4 text-5xl font-black leading-[0.95] text-white md:text-7xl xl:text-8xl">
              {heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">{heroDescription}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={heroHref}>
                <Button className="h-14 rounded-xl bg-white px-7 text-lg font-bold text-black hover:bg-white/90">
                  <Play className="mr-2 h-5 w-5" fill="currentColor" />
                  Play
                </Button>
              </Link>
              <Link href={heroHref}>
                <Button
                  variant="outline"
                  className="h-14 rounded-xl border-white/15 bg-white/15 px-7 text-lg font-bold text-white hover:bg-white/25"
                >
                  <Info className="mr-2 h-5 w-5" />
                  More Info
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-white/72">
              <span className="rounded-full bg-black/30 px-3 py-1">
                Profile {profile.profileId}
              </span>
              {primarySubscription && (
                <span className="rounded-full bg-black/30 px-3 py-1">
                  {primarySubscription.planName}
                </span>
              )}
              <span className="rounded-full bg-black/30 px-3 py-1">
                <Clapperboard className="mr-1 inline h-4 w-4" />
                TMDB discovery
              </span>
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10 -mt-28 px-4 pb-16 md:px-6 xl:px-8">
        <div className="mx-auto max-w-[1500px]">
          {!hasActive ? (
            <section className="rounded-[26px] border border-amber-200/10 bg-[#071121]/92 p-8 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/78">
                Membership Required
              </p>
              <h2 className="mt-4 text-3xl font-black text-white">Renew to unlock the full member library</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/62">
                The streaming layout is in place, but playback and the protected IPTV catalog still require an active subscription.
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
              <MediaRail
                id="continue"
                title="Featured on GameStop"
                items={featuredTiles}
                accent="bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.18),transparent_24%)]"
              />
              <MediaRail id="movies" title="Trending Now" items={trendingTiles} />
              <MediaRail id="movies-popular" title="Popular Movies" items={popularMovieTiles} />
              <MediaRail id="tv-shows" title="TV Shows" items={popularTvTiles} />
              <MediaRail id="top-rated" title="Top Rated Movies" items={topRatedTiles} />
              <MediaRail id="animation" title="Animation" items={animationTiles} />
              <MediaRail
                id="sports"
                title="Sports and Events"
                items={sportsTiles}
                accent="bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.18),transparent_24%)]"
              />
              <MediaRail id="live-tv" title="Live TV Channels" items={liveTiles} />
              <MediaRail id="movie-library" title="Licensed Movie Library" items={movieTiles} />
              <MediaRail id="series-library" title="Series Library" items={seriesTiles} />

              <section className="mt-10 flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-[#071121]/92 px-5 py-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Radio className="h-5 w-5 text-violet-300" />
                  <p className="text-sm font-semibold text-white/82">
                    Need full live browsing? Open the dedicated live TV screen.
                  </p>
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
    </div>
  );
}
