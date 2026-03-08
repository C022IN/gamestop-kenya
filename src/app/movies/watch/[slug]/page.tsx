import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LockKeyhole, PlayCircle, ShieldCheck } from 'lucide-react';
import {
  buildPlaybackSource,
  canAccessContent,
  getContentItemBySlug,
} from '@/lib/movie-platform';
import { getCurrentMovieMember } from '@/lib/movie-session';

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const memberState = await getCurrentMovieMember();
  if (!memberState) {
    redirect('/movies/login');
  }

  const { slug } = await params;
  const item = getContentItemBySlug(slug);
  if (!item) {
    notFound();
  }

  if (!canAccessContent(memberState.profile.profileId, item.id)) {
    redirect('/movies');
  }

  const playback = await buildPlaybackSource(item);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/movies">
          <Button variant="ghost" className="mb-6 px-0 text-gray-300 hover:bg-transparent hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Button>
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.4fr,0.6fr]">
          <section>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-gray-950">
              {playback ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={playback.iframeUrl}
                    title={item.title}
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-gray-900 to-red-950 p-8 text-center">
                  <div className="max-w-md">
                    <PlayCircle className="mx-auto h-12 w-12 text-red-300" />
                    <h1 className="mt-4 text-2xl font-black">Playback Not Configured Yet</h1>
                    <p className="mt-3 text-sm text-gray-300">
                      This title is entitled for the current user, but no Cloudflare Stream video UID is configured for it yet.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-gray-950 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-300">Watch Page</p>
            <h1 className="mt-3 text-3xl font-black">{item.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">{item.synopsis}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {item.genres.map((genre) => (
                <span key={genre} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-gray-200">
                  {genre}
                </span>
              ))}
            </div>

            <div className="mt-5 space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <span>Year</span>
                <span>{item.year}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Duration</span>
                <span>{item.durationMinutes} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rating</span>
                <span>{item.maturityRating}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                <p>Access is checked against your active entitlements before the player is shown.</p>
              </div>
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                <p>
                  Profile ID: <span className="font-mono">{memberState.profile.profileId}</span>
                </p>
              </div>
              {playback && (
                <div className="flex items-start gap-3">
                  <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                  <p>{playback.signed ? 'Signed playback is enabled.' : 'Standard Cloudflare Stream playback is enabled.'}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
