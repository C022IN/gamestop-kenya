import Link from 'next/link';
import {
  BadgeCheck,
  Film,
  PlayCircle,
  Radio,
  Tv2,
  Waves,
} from 'lucide-react';
import {
  hasConfiguredPlayback,
  type IptvCatalogEntry,
} from '@/lib/iptv-catalog';

interface MemberCatalogCardProps {
  item: IptvCatalogEntry;
  playbackLocked?: boolean;
}

function getAccentClasses(kind: IptvCatalogEntry['kind']) {
  switch (kind) {
    case 'live_channel':
      return 'from-sky-500/30 via-cyan-400/20 to-transparent';
    case 'sports_event':
      return 'from-amber-400/30 via-orange-500/20 to-transparent';
    case 'series':
      return 'from-fuchsia-500/30 via-rose-500/20 to-transparent';
    case 'movie':
      return 'from-emerald-500/30 via-teal-500/20 to-transparent';
    case 'episode':
      return 'from-indigo-500/30 via-violet-500/20 to-transparent';
  }
}

function getKindLabel(kind: IptvCatalogEntry['kind']) {
  switch (kind) {
    case 'live_channel':
      return 'Live TV';
    case 'sports_event':
      return 'Sports';
    case 'series':
      return 'Series';
    case 'episode':
      return 'Episode';
    case 'movie':
      return 'Movie';
  }
}

function getKindIcon(kind: IptvCatalogEntry['kind']) {
  switch (kind) {
    case 'live_channel':
      return Radio;
    case 'sports_event':
      return Waves;
    case 'series':
      return Tv2;
    case 'episode':
      return PlayCircle;
    case 'movie':
      return Film;
  }
}

function formatMeta(item: IptvCatalogEntry) {
  if (item.kind === 'sports_event') {
    const startsAt = item.liveEvent?.startsAt ?? item.availableFrom;
    return startsAt
      ? new Date(startsAt).toLocaleString('en-KE', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : 'Schedule pending';
  }

  if (item.kind === 'live_channel') {
    return item.channelNumber ? `CH ${item.channelNumber}` : 'Live channel';
  }

  if (item.kind === 'series') {
    const parts = [`${item.episodes.length} episode${item.episodes.length === 1 ? '' : 's'}`];
    if (item.voteAverage) {
      parts.push(`${item.voteAverage.toFixed(1)} TMDB`);
    }
    return parts.join(' | ');
  }

  const parts = [item.releaseYear ? String(item.releaseYear) : null];
  if (item.durationMinutes) {
    parts.push(`${item.durationMinutes} min`);
  }
  if (item.maturityRating) {
    parts.push(item.maturityRating);
  }
  if (item.voteAverage) {
    parts.push(`${item.voteAverage.toFixed(1)} TMDB`);
  }

  return parts.filter(Boolean).join(' | ') || getKindLabel(item.kind);
}

export default function MemberCatalogCard({
  item,
  playbackLocked = false,
}: MemberCatalogCardProps) {
  const Icon = getKindIcon(item.kind);
  const ready = hasConfiguredPlayback(item);
  const artworkUrl = item.backdropUrl ?? item.posterUrl;
  const actionLabel =
    playbackLocked
      ? 'View details'
      : item.kind === 'series'
      ? 'Open series'
      : item.kind === 'sports_event' || item.kind === 'live_channel'
        ? 'Watch live'
        : 'Play now';

  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-1 transition-transform duration-300 hover:-translate-y-1">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_55%)] opacity-80" />
      <div className={`absolute inset-0 bg-gradient-to-br ${getAccentClasses(item.kind)} opacity-100`} />
      <div className="relative flex h-full flex-col rounded-[24px] bg-[#070b16]/90 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              {getKindLabel(item.kind)}
            </span>
            {item.badge && (
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-black">
                {item.badge}
              </span>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80">
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div
          className="mt-8 min-h-36 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02)),radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_32%),linear-gradient(180deg,rgba(8,15,29,0.15),rgba(8,15,29,0.9))]"
          style={
            artworkUrl
              ? {
                  backgroundImage: `linear-gradient(180deg,rgba(4,8,20,0.15),rgba(4,8,20,0.94)),url(${artworkUrl})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                }
              : undefined
          }
        >
          <div className="p-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white/78">
              <BadgeCheck className="h-3.5 w-3.5" />
              {ready ? 'Playback configured' : 'Source pending'}
            </div>
            <h3 className="mt-4 text-2xl font-black text-white">{item.title}</h3>
            {item.tagline && (
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-white/58">
                {item.tagline}
              </p>
            )}
            <p className="mt-3 text-sm text-white/[0.78]">{item.synopsis}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {item.genres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70"
            >
              {genre}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 text-sm text-white/[0.68]">
          <span>{formatMeta(item)}</span>
          <span>{item.liveEvent?.competition ?? item.territory ?? ''}</span>
        </div>

        <Link
          href={`/movies/watch/${item.slug}`}
          className="mt-6 inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          <span>{actionLabel}</span>
          <PlayCircle className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
