import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  LockKeyhole,
  PlayCircle,
  Radio,
  ShieldCheck,
  Star,
  Tv2,
  Waves,
} from 'lucide-react';
import { getCatalogWatchContext } from '@/lib/iptv-catalog';
import { hasActiveSubscriptionForProfile } from '@/lib/movie-platform';
import { getCurrentMovieMember } from '@/lib/movie-session';

export const dynamic = 'force-dynamic';

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

function getMetaLabel(kind: string) {
  switch (kind) {
    case 'live_channel':
      return 'Live TV';
    case 'sports_event':
      return 'Sports';
    case 'series':
      return 'Series';
    case 'episode':
      return 'Episode';
    default:
      return 'Movie';
  }
}

function getMetaIcon(kind: string) {
  switch (kind) {
    case 'live_channel':
      return Radio;
    case 'sports_event':
      return Waves;
    case 'series':
    case 'episode':
      return Tv2;
    default:
      return PlayCircle;
  }
}

export default async function WatchPage({ params }: WatchPageProps) {
  const memberState = await getCurrentMovieMember();
  if (!memberState) {
    redirect('/movies/login');
  }

  if (!(await hasActiveSubscriptionForProfile(memberState.profile.profileId))) {
    redirect('/movies');
  }

  const { slug } = await params;
  const watchContext = await getCatalogWatchContext(slug);
  if (!watchContext) {
    notFound();
  }

  const { item, playback, playbackEntry, relatedEpisodes, parentSeries } = watchContext;
  const MetaIcon = getMetaIcon(item.kind);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/movies">
          <Button
            variant="ghost"
            className="mb-6 px-0 text-white/70 hover:bg-transparent hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to library
          </Button>
        </Link>

        {item.backdropUrl && (
          <div
            className="mb-8 overflow-hidden rounded-[32px] border border-white/10"
            style={{
              backgroundImage: `linear-gradient(180deg,rgba(3,7,18,0.2),rgba(3,7,18,0.96)),url(${item.backdropUrl})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          >
            <div className="px-6 py-12 md:px-8 md:py-16">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/80">
                <MetaIcon className="h-3.5 w-3.5" />
                {getMetaLabel(item.kind)}
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-black text-white md:text-5xl">
                {item.title}
              </h1>
              {item.tagline && (
                <p className="mt-3 text-sm uppercase tracking-[0.24em] text-white/55">
                  {item.tagline}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.4fr,0.6fr]">
          <section>
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#071121]">
              {playback?.playbackMode === 'iframe' && playback.iframeUrl ? (
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={playback.iframeUrl}
                    title={playbackEntry.title}
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              ) : playback?.playbackMode === 'video' && playback.videoUrl ? (
                <div className="aspect-video w-full bg-black">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full"
                    src={playback.videoUrl}
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_30%),linear-gradient(180deg,#091120_0%,#040814_100%)] p-8 text-center">
                  <div className="max-w-xl">
                    <PlayCircle className="mx-auto h-12 w-12 text-white/75" />
                    <h1 className="mt-4 text-2xl font-black">Playback source not configured yet</h1>
                    <p className="mt-3 text-sm leading-6 text-white/[0.66]">
                      This title is visible in the member hub, but it still needs a provider source in
                      the IPTV playback table before it can be watched here.
                    </p>
                    {item.kind === 'sports_event' && (
                      <p className="mt-3 text-sm leading-6 text-amber-200/80">
                        For premium fixtures like Champions League, attach the licensed event feed to
                        this slot before going live.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            {!item.backdropUrl && (
              <>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/80">
                  <MetaIcon className="h-3.5 w-3.5" />
                  {getMetaLabel(item.kind)}
                </div>
                <h1 className="mt-4 text-3xl font-black text-white">{item.title}</h1>
                {item.tagline && (
                  <p className="mt-3 text-xs uppercase tracking-[0.24em] text-white/55">
                    {item.tagline}
                  </p>
                )}
              </>
            )}

            {item.posterUrl && (
              <div className="mb-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="aspect-[2/3] w-full object-cover"
                />
              </div>
            )}

            <p className="text-sm leading-6 text-white/[0.68]">{item.synopsis}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {item.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs text-white/70"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="mt-6 space-y-3 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm text-white/[0.72]">
              {parentSeries && (
                <div className="flex items-start justify-between gap-3">
                  <span>Series</span>
                  <span className="text-right text-white">{parentSeries.title}</span>
                </div>
              )}
              {item.liveEvent?.competition && (
                <div className="flex items-start justify-between gap-3">
                  <span>Competition</span>
                  <span className="text-right text-white">{item.liveEvent.competition}</span>
                </div>
              )}
              {item.liveEvent?.startsAt && (
                <div className="flex items-start justify-between gap-3">
                  <span>Starts</span>
                  <span className="text-right text-white">
                    {new Date(item.liveEvent.startsAt).toLocaleString('en-KE', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
              {item.releaseYear && (
                <div className="flex items-start justify-between gap-3">
                  <span>Year</span>
                  <span className="text-right text-white">{item.releaseYear}</span>
                </div>
              )}
              {item.durationMinutes && (
                <div className="flex items-start justify-between gap-3">
                  <span>Duration</span>
                  <span className="text-right text-white">{item.durationMinutes} min</span>
                </div>
              )}
              {item.voteAverage && (
                <div className="flex items-start justify-between gap-3">
                  <span>Score</span>
                  <span className="inline-flex items-center gap-1 text-right text-white">
                    <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" />
                    {item.voteAverage.toFixed(1)} TMDB
                  </span>
                </div>
              )}
              {item.maturityRating && (
                <div className="flex items-start justify-between gap-3">
                  <span>Maturity</span>
                  <span className="text-right text-white">{item.maturityRating}</span>
                </div>
              )}
              {item.liveEvent?.homeTeam && item.liveEvent?.awayTeam && (
                <div className="flex items-start justify-between gap-3">
                  <span>Fixture</span>
                  <span className="text-right text-white">
                    {item.liveEvent.homeTeam} vs {item.liveEvent.awayTeam}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/[0.72]">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p>Access is checked against your active subscription before playback is shown.</p>
              </div>
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                <p>
                  Member ID: <span className="font-mono text-white">{memberState.profile.profileId}</span>
                </p>
              </div>
              {playback && (
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                  <p>
                    Provider: <span className="text-white">{playback.provider}</span>
                  </p>
                </div>
              )}
            </div>

            {playback?.playbackMode === 'external' && playback.externalUrl && (
              <a
                href={playback.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-200"
              >
                <ExternalLink className="h-4 w-4" />
                Open provider source
              </a>
            )}

            {relatedEpisodes.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-black text-white">Episodes</h2>
                <div className="mt-3 space-y-2">
                  {relatedEpisodes.map((episode) => (
                    <Link
                      key={episode.id}
                      href={`/movies/watch/${episode.slug}`}
                      className={`block rounded-2xl border px-4 py-3 text-sm transition-colors ${
                        episode.slug === item.slug
                          ? 'border-white/20 bg-white/[0.08] text-white'
                          : 'border-white/10 bg-white/[0.03] text-white/[0.72] hover:bg-white/[0.06]'
                      }`}
                    >
                      {episode.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
