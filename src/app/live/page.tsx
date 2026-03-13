import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Radio, ShieldCheck, Tv2, Waves } from 'lucide-react';
import { getCurrentMovieMember } from '@/lib/movie-session';
import { hasActiveSubscriptionForProfile } from '@/lib/movie-platform';
import { CHANNEL_CATEGORIES } from '@/lib/iptv-org';
import ChannelBrowser from '@/components/iptv/ChannelBrowser';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Live TV - GameStop IPTV' };

export default async function LiveTvPage() {
  const memberState = await getCurrentMovieMember();
  if (!memberState) redirect('/movies/login');

  const hasActive = await hasActiveSubscriptionForProfile(memberState.profile.profileId);
  if (!hasActive) redirect('/movies');

  const categories = Object.entries(CHANNEL_CATEGORIES).map(([key, value]) => ({
    key,
    label: value.label,
    emoji: value.emoji,
  }));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#040814] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_30%),linear-gradient(180deg,#040814_0%,#060d1d_44%,#040814_100%)]" />
      <div className="fixed inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />

      <div className="relative">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#040814]/78 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 xl:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/movies"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/72 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
              <div className="hidden h-5 w-px bg-white/10 md:block" />
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                <Radio className="h-4 w-4 text-violet-300" />
                Live TV
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-red-200">
              <span className="h-2 w-2 rounded-full bg-red-300 animate-pulse" />
              8,000+ channels
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 pb-16 pt-6 md:px-6 xl:px-8">
          <section className="grid gap-5 xl:grid-cols-[1.32fr,0.68fr]">
            <article className="overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.14),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/78">
                <Radio className="h-3.5 w-3.5" />
                Global live access
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight text-white md:text-6xl">
                Browse live categories first, then switch channels without leaving the stream.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/62 md:text-lg">
                The live experience now follows the same dense dashboard language as the member hub:
                clear categories, a large player, and channel switching that stays fast.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/movies"
                  className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                  <Tv2 className="h-4 w-4" />
                  Open movie dashboard
                </Link>
                <Link
                  href="/iptv"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white/72 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Manage plan
                </Link>
              </div>
            </article>

            <div className="grid gap-5">
              {[
                {
                  title: 'Sports focus',
                  copy: 'Champions League and premium fixtures stay surfaced inside sports categories and event rails.',
                  icon: Waves,
                },
                {
                  title: 'Session ready',
                  copy: `Signed in as ${memberState.profile.profileId}. Access remains gated by your active IPTV subscription.`,
                  icon: ShieldCheck,
                },
              ].map(({ title, copy, icon: Icon }) => (
                <section
                  key={title}
                  className="rounded-[32px] border border-white/10 bg-white/[0.05] p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white/82">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-white">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/56">{copy}</p>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-[36px] border border-white/10 bg-black/18 p-5 md:p-6">
            <ChannelBrowser initialCategories={categories} />
          </section>
        </main>
      </div>
    </div>
  );
}
