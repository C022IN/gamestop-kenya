import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Info,
  LockKeyhole,
  PlayCircle,
  Star,
  ShieldCheck,
  Tv2,
} from 'lucide-react';
import CompatiblePlayerFrame from '@/components/movies/CompatiblePlayerFrame';
import {
  buildCompatibleMoviePlayerUrl,
  buildCompatibleTvPlayerUrl,
  getCompatiblePlayerOrigin,
  getDefaultCompatiblePlayerOptions,
  isCompatiblePlayerConfigured,
} from '@/lib/compatible-player';
import { toTmdbDetailsTile } from '@/lib/movie-hub';
import {
  getCredits,
  getDetails,
  getSeasonDetails,
  getSimilar,
  getVideos,
  tmdbBackdrop,
  tmdbPoster,
  type TmdbEpisodeDetails,
  type TmdbItem,
  type TmdbSeasonSummary,
} from '@/lib/tmdb';
import { getMovieMembershipState } from '@/lib/movie-platform';
import { getCurrentMovieMember } from '@/lib/movie-session';

export const dynamic = 'force-dynamic';

interface FilmPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    play?: string;
    season?: string;
    episode?: string;
  }>;
}

function parseId(raw: string): { mediaType: 'movie' | 'tv'; tmdbId: number } | null {
  const match = raw.match(/^(movie|tv)-(\d+)$/);
  if (!match) {
    return null;
  }

  return {
    mediaType: match[1] as 'movie' | 'tv',
    tmdbId: Number(match[2]),
  };
}

function titleFromItem(item: TmdbItem | null | undefined) {
  return item?.title ?? item?.name ?? 'Untitled';
}

function yearFromItem(item: TmdbItem | null | undefined) {
  const raw = item?.release_date ?? item?.first_air_date ?? '';
  return raw.slice(0, 4);
}

function trailerKeyFromResults(results: { key: string; site: string; type: string; official: boolean }[]) {
  return (
    results.find((video) => video.site === 'YouTube' && video.type === 'Trailer' && video.official)
      ?.key ??
    results.find((video) => video.site === 'YouTube' && video.type === 'Trailer')?.key ??
    results.find((video) => video.site === 'YouTube')?.key ??
    null
  );
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function formatEpisodeCode(seasonNumber: number, episodeNumber: number) {
  return `S${String(seasonNumber).padStart(2, '0')} E${String(episodeNumber).padStart(2, '0')}`;
}

function buildFilmHref(
  id: string,
  options: {
    play?: boolean;
    season?: number;
    episode?: number;
    anchor?: string;
  }
) {
  const params = new URLSearchParams();
  if (options.play) {
    params.set('play', '1');
  }
  if (typeof options.season === 'number') {
    params.set('season', String(options.season));
  }
  if (typeof options.episode === 'number') {
    params.set('episode', String(options.episode));
  }

  const query = params.toString();
  return `/movies/film/${id}${query ? `?${query}` : ''}${options.anchor ? `#${options.anchor}` : ''}`;
}

function SeasonLink({
  id,
  season,
  selected,
}: {
  id: string;
  season: TmdbSeasonSummary;
  selected: boolean;
}) {
  return (
    <Link
      href={buildFilmHref(id, {
        season: season.season_number,
        episode: 1,
        anchor: 'episodes',
      })}
      className={`inline-flex min-w-[120px] shrink-0 flex-col rounded-2xl border px-4 py-3 text-left transition-colors ${
        selected
          ? 'border-cyan-300/70 bg-cyan-400/14 text-white'
          : 'border-white/10 bg-[#071121] text-white/74 hover:border-white/20 hover:text-white'
      }`}
    >
      <span className="text-sm font-bold">
        {season.name || `Season ${season.season_number}`}
      </span>
      <span className="mt-1 text-xs uppercase tracking-[0.14em] text-white/48">
        {season.episode_count} episodes
      </span>
    </Link>
  );
}

function EpisodeCard({
  id,
  seasonNumber,
  episode,
  playbackLocked,
  selected,
}: {
  id: string;
  seasonNumber: number;
  episode: TmdbEpisodeDetails;
  playbackLocked: boolean;
  selected: boolean;
}) {
  const stillUrl = tmdbBackdrop(episode.still_path, 'w780');
  const episodeHref = playbackLocked
    ? buildFilmHref(id, {
        season: seasonNumber,
        episode: episode.episode_number,
        anchor: 'episodes',
      })
    : buildFilmHref(id, {
        play: true,
        season: seasonNumber,
        episode: episode.episode_number,
        anchor: 'player',
      });

  return (
    <Link
      href={episodeHref}
      className={`group overflow-hidden rounded-[24px] border transition-all duration-300 ${
        selected
          ? 'border-cyan-300/70 bg-cyan-400/[0.08] shadow-[0_24px_60px_-36px_rgba(34,211,238,0.4)]'
          : 'border-white/10 bg-[#071121] hover:-translate-y-1 hover:border-white/18'
      }`}
    >
      <div className="grid gap-0 md:grid-cols-[220px,1fr]">
        <div className="relative aspect-video overflow-hidden md:aspect-auto md:min-h-[180px]">
          {stillUrl ? (
            <Image
              src={stillUrl}
              alt={episode.name}
              fill
              sizes="(max-width: 768px) 100vw, 220px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.18),transparent_30%),linear-gradient(180deg,#091120_0%,#040814_100%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/10 to-transparent" />
        </div>

        <div className="flex flex-col p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/54">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-white/72">
              {formatEpisodeCode(seasonNumber, episode.episode_number)}
            </span>
            {episode.runtime ? (
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-white/72">
                {episode.runtime} min
              </span>
            ) : null}
            {episode.air_date ? (
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-white/72">
                {episode.air_date}
              </span>
            ) : null}
          </div>

          <h3 className="mt-4 text-xl font-black text-white">{episode.name}</h3>
          <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/68">
            {episode.overview?.trim() || 'Open this episode to start playback.'}
          </p>

          <div className="mt-auto pt-5 text-sm font-bold text-cyan-100">
            {selected
              ? playbackLocked
                ? 'Selected episode'
                : 'Selected for playback'
              : playbackLocked
                ? 'View episode'
                : 'Play episode'}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SimilarTile({ item, mediaType }: { item: TmdbItem; mediaType: 'movie' | 'tv' }) {
  const title = titleFromItem(item);
  const poster = tmdbPoster(item.poster_path, 'w342');

  return (
    <Link
      href={`/movies/film/${mediaType}-${item.id}`}
      className="group block min-w-[180px] shrink-0 overflow-hidden rounded-[20px] border border-white/10 bg-[#071121] transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
    >
      <div className="relative aspect-[2/3]">
        {poster ? (
          <Image
            src={poster}
            alt={title}
            fill
            sizes="180px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.22),transparent_28%),linear-gradient(180deg,#091120_0%,#040814_100%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="line-clamp-2 text-sm font-bold text-white">{title}</p>
        </div>
      </div>
    </Link>
  );
}

export default async function FilmPage({ params, searchParams }: FilmPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const parsed = parseId(id);

  if (!parsed) {
    notFound();
  }

  const { mediaType, tmdbId } = parsed;
  const [details, videos, credits, similar] = await Promise.all([
    getDetails(mediaType, tmdbId),
    getVideos(mediaType, tmdbId),
    getCredits(mediaType, tmdbId),
    getSimilar(mediaType, tmdbId),
  ]);

  if (!details) {
    notFound();
  }

  const memberState = await getCurrentMovieMember();
  const membership = memberState
    ? await getMovieMembershipState(memberState.profile.profileId)
    : null;
  const playbackLocked = !(membership?.hasActiveSubscription ?? false);
  const latestSubscription = membership?.latestSubscription ?? null;
  const subscriptionEndsLabel = latestSubscription?.expiresAt
    ? new Date(latestSubscription.expiresAt).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;
  const playbackPromptHref = memberState ? '/iptv' : '/movies/login';
  const playbackPromptLabel = memberState
    ? latestSubscription
      ? 'Renew to watch'
      : 'View plans'
    : 'Sign in to watch';

  const title = titleFromItem(details);
  const year = yearFromItem(details);
  const rating = details.vote_average ? details.vote_average.toFixed(1) : null;
  const backdropUrl = tmdbBackdrop(details.backdrop_path, 'original');
  const posterUrl = tmdbPoster(details.poster_path, 'w500');
  const availableSeasons =
    mediaType === 'tv'
      ? [...(details.seasons ?? [])]
          .filter((season) => season.episode_count > 0)
          .sort((left, right) => left.season_number - right.season_number)
      : [];
  const trailerKey = trailerKeyFromResults(videos?.results ?? []);
  const cast = (credits?.cast ?? []).slice(0, 8);
  const relatedTitles = (similar?.results ?? []).slice(0, 10);
  const playerEnabled = isCompatiblePlayerConfigured();
  const playerOptions = getDefaultCompatiblePlayerOptions();
  const historyItem = toTmdbDetailsTile(details, mediaType);
  const requestedSeason = parsePositiveInteger(query.season, availableSeasons[0]?.season_number ?? 1);
  const defaultSeason =
    mediaType === 'tv'
      ? availableSeasons.find((season) => season.season_number === requestedSeason)?.season_number ??
        availableSeasons[0]?.season_number ??
        1
      : 1;
  const selectedSeasonDetails =
    mediaType === 'tv' ? await getSeasonDetails(tmdbId, defaultSeason) : null;
  const seasonEpisodes = selectedSeasonDetails?.episodes ?? [];
  const requestedEpisode = parsePositiveInteger(query.episode, seasonEpisodes[0]?.episode_number ?? 1);
  const selectedEpisode =
    mediaType === 'tv'
      ? seasonEpisodes.find((episode) => episode.episode_number === requestedEpisode) ??
        seasonEpisodes[0] ??
        null
      : null;
  const defaultEpisode = selectedEpisode?.episode_number ?? 1;
  const shouldPlay = query.play === '1' && !playbackLocked;
  const playerOrigin = getCompatiblePlayerOrigin();
  const playerUrl =
    mediaType === 'movie'
      ? buildCompatibleMoviePlayerUrl(tmdbId, playerOptions)
      : buildCompatibleTvPlayerUrl(tmdbId, defaultSeason, defaultEpisode, playerOptions);
  const playHref =
    mediaType === 'movie'
      ? buildFilmHref(id, { play: true, anchor: 'player' })
      : buildFilmHref(id, {
          play: true,
          season: defaultSeason,
          episode: defaultEpisode,
          anchor: 'player',
        });
  const browseEpisodesHref =
    mediaType === 'tv'
      ? buildFilmHref(id, {
          season: defaultSeason,
          episode: defaultEpisode,
          anchor: 'episodes',
        })
      : null;
  const playLabel =
    mediaType === 'tv'
      ? `Play ${formatEpisodeCode(defaultSeason, defaultEpisode)}`
      : 'Play';

  return (
    <div className="min-h-screen bg-[#040814] text-white">
      <section className="relative min-h-[72vh] overflow-hidden">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_30%),linear-gradient(180deg,#040814_0%,#060d1d_44%,#040814_100%)]" />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,8,20,0.92)_0%,rgba(4,8,20,0.55)_42%,rgba(4,8,20,0.2)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,20,0.15)_0%,rgba(4,8,20,0.05)_48%,#040814_100%)]" />

        <div className="relative z-10 mx-auto max-w-[1500px] px-4 pb-20 pt-8 md:px-6 xl:px-8">
          <Link
            href="/movies"
            className="inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-sm font-semibold text-white/86 transition-colors hover:bg-black/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="mt-16 grid gap-8 lg:grid-cols-[220px,1fr] lg:items-end">
            <div className="hidden lg:block">
              {posterUrl && (
                <div className="relative aspect-[2/3] overflow-hidden rounded-[26px] border border-white/10 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.85)]">
                  <Image
                    src={posterUrl}
                    alt={title}
                    fill
                    sizes="220px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.34em] text-cyan-200/78">
                TMDB title
              </p>
              <h1 className="mt-4 text-5xl font-black leading-[0.95] text-white md:text-7xl">
                {title}
              </h1>
              {details.tagline && (
                <p className="mt-4 text-base font-medium text-white/62 md:text-lg">
                  {details.tagline}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-white/78">
                {year && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2">
                    <Calendar className="h-4 w-4" />
                    {year}
                  </span>
                )}
                {details.runtime && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2">
                    <Clock className="h-4 w-4" />
                    {details.runtime} min
                  </span>
                )}
                {details.number_of_seasons && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2">
                    <Tv2 className="h-4 w-4" />
                    {details.number_of_seasons} season{details.number_of_seasons !== 1 ? 's' : ''}
                  </span>
                )}
                {details.number_of_episodes && mediaType === 'tv' && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2">
                    <PlayCircle className="h-4 w-4" />
                    {details.number_of_episodes} episodes
                  </span>
                )}
                {rating && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2">
                    <Star className="h-4 w-4 text-amber-400" fill="currentColor" />
                    {rating}
                  </span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {details.genres?.map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/74"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              {details.overview && (
                <p className="mt-6 max-w-3xl text-lg leading-8 text-white/84">
                  {details.overview}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                {!playbackLocked && playerEnabled && playerUrl ? (
                  <a
                    href={playHref}
                    className="inline-flex h-14 items-center rounded-xl bg-white px-7 text-lg font-bold text-black transition-colors hover:bg-white/90"
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    {playLabel}
                  </a>
                ) : (
                  <Link
                    href={playbackPromptHref}
                    className="inline-flex h-14 items-center rounded-xl bg-amber-300 px-7 text-lg font-bold text-slate-950 transition-colors hover:bg-amber-200"
                  >
                    <LockKeyhole className="mr-2 h-5 w-5" />
                    {playbackPromptLabel}
                  </Link>
                )}
                {browseEpisodesHref ? (
                  <a
                    href={browseEpisodesHref}
                    className="inline-flex h-14 items-center rounded-xl border border-cyan-300/18 bg-cyan-400/[0.08] px-7 text-lg font-bold text-cyan-50 transition-colors hover:bg-cyan-400/[0.14]"
                  >
                    <Tv2 className="mr-2 h-5 w-5" />
                    Choose Episodes
                  </a>
                ) : null}
                {trailerKey && (
                  <a
                    href={`#trailer`}
                    className="inline-flex h-14 items-center rounded-xl border border-white/15 bg-white/15 px-7 text-lg font-bold text-white transition-colors hover:bg-white/25"
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Watch Trailer
                  </a>
                )}
                <Link
                  href={`/movies/search?q=${encodeURIComponent(title)}`}
                  className="inline-flex h-14 items-center rounded-xl border border-white/15 bg-white/15 px-7 text-lg font-bold text-white transition-colors hover:bg-white/25"
                >
                  <Info className="mr-2 h-5 w-5" />
                  Search More
                </Link>
              </div>

              {playbackLocked ? (
                <p className="mt-4 max-w-3xl text-sm leading-7 text-amber-200/82">
                  {memberState
                    ? subscriptionEndsLabel
                      ? `Your subscription ended ${subscriptionEndsLabel}. Browse title details and episodes, then renew to restore playback.`
                      : 'Your subscription is not active right now. Browse title details, then renew to restore playback.'
                    : 'Browse title details now, then sign in with an active subscription to unlock playback.'}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1500px] px-4 pb-16 md:px-6 xl:px-8">
        {playbackLocked ? (
          <section id="player" className="mt-6">
            <div className="rounded-[28px] border border-amber-200/12 bg-[#071121] p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/12 text-amber-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[1.75rem] font-black tracking-tight text-white">Playback locked</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-white/64">
                    {memberState
                      ? subscriptionEndsLabel
                        ? `Playback is disabled because the last active subscription ended on ${subscriptionEndsLabel}. Renew to resume watching instantly.`
                        : 'Playback is disabled until the subscription is active again.'
                      : 'Sign in with an active subscription to watch this title.'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {!playbackLocked && playerEnabled && playerUrl && shouldPlay && (
          <section id="player" className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[1.75rem] font-black tracking-tight text-white">Player</h2>
                <p className="mt-1 text-sm text-white/56">
                  {mediaType === 'tv'
                    ? selectedEpisode
                      ? `Now playing ${formatEpisodeCode(defaultSeason, defaultEpisode)} - ${selectedEpisode.name}.`
                      : `Starting at Season ${defaultSeason}, Episode ${defaultEpisode}.`
                    : 'Using the configured player.'}
                </p>
              </div>
            </div>
            <CompatiblePlayerFrame
              src={playerUrl}
              title={
                mediaType === 'tv'
                  ? `${title} ${formatEpisodeCode(defaultSeason, defaultEpisode)}`
                  : `${title} player`
              }
              playerOrigin={playerOrigin}
              historyItem={historyItem}
              storageKey={
                mediaType === 'tv'
                  ? `tv-${tmdbId}-s${defaultSeason}-e${defaultEpisode}`
                  : `${mediaType}-${tmdbId}`
              }
            />
          </section>
        )}

        {mediaType === 'tv' && (
          <section id="episodes" className="mt-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-[1.75rem] font-black tracking-tight text-white">Episodes</h2>
                <p className="mt-1 text-sm text-white/56">
                  Pick a season, then jump straight into the episode you want.
                </p>
              </div>
              {selectedEpisode ? (
                <span className="rounded-full border border-cyan-300/18 bg-cyan-400/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-50">
                  Selected {formatEpisodeCode(defaultSeason, defaultEpisode)}
                </span>
              ) : null}
            </div>

            {availableSeasons.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {availableSeasons.map((season) => (
                  <SeasonLink
                    key={season.id}
                    id={id}
                    season={season}
                    selected={season.season_number === defaultSeason}
                  />
                ))}
              </div>
            ) : null}

            {selectedSeasonDetails?.overview ? (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-[#071121] p-5 text-sm leading-7 text-white/70">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/46">
                  {selectedSeasonDetails.name || `Season ${defaultSeason}`}
                </p>
                <p className="mt-2">{selectedSeasonDetails.overview}</p>
              </div>
            ) : null}

            {seasonEpisodes.length > 0 ? (
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {seasonEpisodes.map((episode) => (
                  <EpisodeCard
                    key={episode.id}
                    id={id}
                    seasonNumber={defaultSeason}
                    episode={episode}
                    playbackLocked={playbackLocked}
                    selected={episode.episode_number === defaultEpisode}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-[#071121] p-6 text-sm text-white/62">
                Episode data is not available for this season yet.
              </div>
            )}
          </section>
        )}

        {trailerKey && (
          <section id="trailer" className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-[1.75rem] font-black tracking-tight text-white">Trailer</h2>
            </div>
            <div className="overflow-hidden rounded-[26px] border border-white/10 bg-black">
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${trailerKey}?rel=0`}
                  title={`${title} trailer`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </section>
        )}

        {cast.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-[1.75rem] font-black tracking-tight text-white">Cast</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {cast.map((member) => {
                const profileUrl = tmdbPoster(member.profile_path, 'w342');
                return (
                  <div
                    key={`${member.name}-${member.character}`}
                    className="min-w-[170px] shrink-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#071121]"
                  >
                    <div className="relative aspect-[2/3]">
                      {profileUrl ? (
                        <Image
                          src={profileUrl}
                          alt={member.name}
                          fill
                          sizes="170px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.18),transparent_30%),linear-gradient(180deg,#091120_0%,#040814_100%)]" />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-bold text-white">{member.name}</p>
                      <p className="mt-1 text-xs text-white/54">{member.character}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {relatedTitles.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-[1.75rem] font-black tracking-tight text-white">More Like This</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {relatedTitles.map((item) => (
                <SimilarTile key={item.id} item={item} mediaType={mediaType} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
