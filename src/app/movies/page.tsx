import Link from 'next/link';
import { redirect } from 'next/navigation';
import MemberLogoutButton from '@/components/movies/MemberLogoutButton';
import { Button } from '@/components/ui/button';
import { Film, PlayCircle, ShieldCheck } from 'lucide-react';
import { getAccessibleContentForProfile } from '@/lib/movie-platform';
import { getCurrentMovieMember } from '@/lib/movie-session';

export default async function MoviesPage() {
  const memberState = await getCurrentMovieMember();
  if (!memberState) {
    redirect('/movies/login');
  }

  const { profile } = memberState;
  const contentItems = await getAccessibleContentForProfile(profile.profileId);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <section className="border-b border-white/10 bg-gradient-to-br from-gray-950 via-red-950 to-gray-900 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-300">
                Logged In Movie Flow
              </p>
              <h1 className="mt-3 text-4xl font-black md:text-5xl">GameStop Movies</h1>
              <p className="mt-4 max-w-2xl text-lg text-gray-300">
                Your access is linked to profile ID <span className="font-mono">{profile.profileId}</span>.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/iptv">
                <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  Billing Dashboard
                </Button>
              </Link>
              <MemberLogoutButton />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Film,
                title: `${contentItems.length} entitled titles`,
                text: 'The library shown below is filtered by your active subscription entitlements.',
              },
              {
                icon: ShieldCheck,
                title: 'Phone-based membership',
                text: 'Your M-Pesa number acts as your profile ID in the current version.',
              },
              {
                icon: PlayCircle,
                title: 'Cloudflare Stream playback',
                text: 'Watch pages use a Cloudflare Stream player when a stream UID is configured.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/20 text-red-100">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm text-gray-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">My Library</h2>
              <p className="mt-1 text-sm text-gray-400">
                Titles available under your current active subscription.
              </p>
            </div>
          </div>

          {contentItems.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-gray-400">
              No entitled titles are available for this account yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {contentItems.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                  <div className="h-44 bg-gradient-to-br from-red-700 via-red-500 to-amber-500" />
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 text-xs text-red-200">
                      {item.genres.map((genre) => (
                        <span key={genre} className="rounded-full bg-white/10 px-2.5 py-1">
                          {genre}
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-4 text-2xl font-black text-white">{item.title}</h3>
                    <p className="mt-2 text-sm text-gray-300">{item.synopsis}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
                      <span>{item.year}</span>
                      <span>{item.durationMinutes} min</span>
                      <span>{item.maturityRating}</span>
                    </div>
                    <Link href={`/movies/watch/${item.slug}`} className="mt-6 block">
                      <Button className="w-full rounded-xl bg-red-600 py-5 font-bold hover:bg-red-700">
                        Watch Now
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
