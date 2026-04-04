import 'server-only';

import { getSupabaseAdminClient } from '@/lib/supabase/server';
import {
  findByImdbId,
  getDetails,
  getEpisodeDetails,
  isTmdbConfigured,
  searchMulti,
  tmdbBackdrop,
  tmdbPoster,
  type TmdbItem,
  type TmdbMediaType,
} from '@/lib/tmdb';

export type IptvCatalogKind =
  | 'live_channel'
  | 'movie'
  | 'series'
  | 'episode'
  | 'sports_event';

export type IptvSourceType =
  | 'iframe'
  | 'hls'
  | 'dash'
  | 'cloudflare_stream'
  | 'external_link';

export interface IptvCatalogItem {
  id: string;
  parentId?: string;
  kind: IptvCatalogKind;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl?: string;
  backdropUrl?: string;
  logoUrl?: string;
  badge?: string;
  genres: string[];
  territory?: string;
  releaseYear?: number;
  durationMinutes?: number;
  maturityRating?: string;
  channelNumber?: number;
  isFeatured: boolean;
  availableFrom?: string;
  availableUntil?: string;
  voteAverage?: number;
  tagline?: string;
  tmdbId?: number;
  tmdbType?: TmdbMediaType;
  imdbId?: string;
  metadata: Record<string, unknown>;
}

export interface IptvPlaybackSource {
  id: string;
  itemId: string;
  provider: string;
  sourceType: IptvSourceType;
  streamUrl: string;
  embedUrl?: string;
  isPrimary: boolean;
  isLive: boolean;
  drmConfig: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface IptvLiveEvent {
  itemId: string;
  competition: string;
  homeTeam?: string;
  awayTeam?: string;
  startsAt: string;
  endsAt?: string;
  venue?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  metadata: Record<string, unknown>;
}

export interface IptvCatalogEntry extends IptvCatalogItem {
  sources: IptvPlaybackSource[];
  liveEvent?: IptvLiveEvent;
  episodes: IptvCatalogEntry[];
}

export interface IptvCatalogSections {
  featured: IptvCatalogEntry[];
  liveChannels: IptvCatalogEntry[];
  movies: IptvCatalogEntry[];
  series: IptvCatalogEntry[];
  sportsEvents: IptvCatalogEntry[];
  counts: {
    liveChannels: number;
    movies: number;
    series: number;
    sportsEvents: number;
    totalTopLevel: number;
  };
}

export interface ResolvedCatalogPlaybackSource {
  provider: string;
  sourceType: IptvSourceType;
  playbackMode: 'iframe' | 'video' | 'external';
  iframeUrl?: string;
  videoUrl?: string;
  externalUrl?: string;
  hlsUrl?: string;
  dashUrl?: string;
  signed: boolean;
  isLive: boolean;
}

export interface IptvWatchContext {
  item: IptvCatalogEntry;
  playbackEntry: IptvCatalogEntry;
  playback: ResolvedCatalogPlaybackSource | null;
  relatedEpisodes: IptvCatalogEntry[];
  parentSeries?: IptvCatalogEntry;
}

export interface IptvPlaylistEntry {
  id: string;
  title: string;
  groupTitle: string;
  logoUrl?: string;
  url: string;
}

interface CatalogItemRow {
  id: string;
  parent_id: string | null;
  kind: IptvCatalogKind;
  title: string;
  slug: string;
  synopsis: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  logo_url: string | null;
  badge: string | null;
  genres: string[] | null;
  territory: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  maturity_rating: string | null;
  channel_number: number | null;
  is_featured: boolean | null;
  available_from: string | null;
  available_until: string | null;
  metadata: unknown;
}

interface PlaybackSourceRow {
  id: string;
  item_id: string;
  provider: string;
  source_type: IptvSourceType;
  stream_url: string;
  embed_url: string | null;
  is_primary: boolean | null;
  is_live: boolean | null;
  drm_config: unknown;
  metadata: unknown;
}

interface LiveEventRow {
  item_id: string;
  competition: string;
  home_team: string | null;
  away_team: string | null;
  starts_at: string;
  ends_at: string | null;
  venue: string | null;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  metadata: unknown;
}

interface ResolvedTmdbBinding {
  mediaType: TmdbMediaType;
  tmdbId: number;
  imdbId?: string;
}

function trimEnv(value: string | undefined): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

function parsePlaybackSourceType(value: string | undefined): IptvSourceType | undefined {
  switch (value?.trim().toLowerCase()) {
    case 'iframe':
    case 'hls':
    case 'dash':
    case 'external_link':
    case 'cloudflare_stream':
      return value.trim().toLowerCase() as IptvSourceType;
    default:
      return undefined;
  }
}

function inferPlaybackSourceType(url: string | undefined): IptvSourceType | undefined {
  if (!url) {
    return undefined;
  }

  const normalizedUrl = url.toLowerCase();
  if (normalizedUrl.includes('.m3u8')) {
    return 'hls';
  }
  if (normalizedUrl.includes('.mpd')) {
    return 'dash';
  }
  return 'external_link';
}

function envPlaybackConfig(
  sourceTypeEnv: string,
  urlEnv: string,
  embedEnv: string,
  providerEnv: string
): {
  sourceType?: IptvSourceType;
  streamUrl?: string;
  embedUrl?: string;
  provider?: string;
} {
  const streamUrl = trimEnv(process.env[urlEnv]);
  const sourceType =
    parsePlaybackSourceType(process.env[sourceTypeEnv]) ?? inferPlaybackSourceType(streamUrl);

  return {
    sourceType,
    streamUrl,
    embedUrl: trimEnv(process.env[embedEnv]),
    provider: trimEnv(process.env[providerEnv]) ?? (streamUrl ? getProviderName() : undefined),
  };
}

function stringFromUnknown(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const next = value.trim();
  return next ? next : undefined;
}

function numberFromUnknown(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
}

function tmdbMediaTypeFromUnknown(value: unknown): TmdbMediaType | undefined {
  return value === 'movie' || value === 'tv' ? value : undefined;
}

function recordFromUnknown(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function arrayFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}

function toCatalogItem(row: CatalogItemRow): IptvCatalogItem {
  const metadata = recordFromUnknown(row.metadata);
  return {
    id: row.id,
    parentId: row.parent_id ?? undefined,
    kind: row.kind,
    title: row.title,
    slug: row.slug,
    synopsis: row.synopsis ?? '',
    posterUrl: row.poster_url ?? undefined,
    backdropUrl: row.backdrop_url ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    badge: row.badge ?? undefined,
    genres: row.genres ?? [],
    territory: row.territory ?? undefined,
    releaseYear: row.release_year ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    maturityRating: row.maturity_rating ?? undefined,
    channelNumber: row.channel_number ?? undefined,
    isFeatured: row.is_featured ?? false,
    availableFrom: row.available_from ?? undefined,
    availableUntil: row.available_until ?? undefined,
    voteAverage: numberFromUnknown(metadata.voteAverage),
    tagline: stringFromUnknown(metadata.tagline),
    tmdbId: numberFromUnknown(metadata.tmdbId),
    tmdbType: tmdbMediaTypeFromUnknown(metadata.tmdbType),
    imdbId: stringFromUnknown(metadata.imdbId),
    metadata,
  };
}

function toPlaybackSource(row: PlaybackSourceRow): IptvPlaybackSource {
  return {
    id: row.id,
    itemId: row.item_id,
    provider: row.provider,
    sourceType: row.source_type,
    streamUrl: row.stream_url,
    embedUrl: row.embed_url ?? undefined,
    isPrimary: row.is_primary ?? true,
    isLive: row.is_live ?? false,
    drmConfig: recordFromUnknown(row.drm_config),
    metadata: recordFromUnknown(row.metadata),
  };
}

function toLiveEvent(row: LiveEventRow): IptvLiveEvent {
  return {
    itemId: row.item_id,
    competition: row.competition,
    homeTeam: row.home_team ?? undefined,
    awayTeam: row.away_team ?? undefined,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? undefined,
    venue: row.venue ?? undefined,
    status: row.status,
    metadata: recordFromUnknown(row.metadata),
  };
}

function toCatalogItemInsert(item: IptvCatalogItem) {
  return {
    id: item.id,
    parent_id: item.parentId ?? null,
    kind: item.kind,
    title: item.title,
    slug: item.slug,
    synopsis: item.synopsis,
    poster_url: item.posterUrl ?? null,
    backdrop_url: item.backdropUrl ?? null,
    logo_url: item.logoUrl ?? null,
    badge: item.badge ?? null,
    genres: item.genres,
    territory: item.territory ?? null,
    release_year: item.releaseYear ?? null,
    duration_minutes: item.durationMinutes ?? null,
    maturity_rating: item.maturityRating ?? null,
    channel_number: item.channelNumber ?? null,
    is_featured: item.isFeatured,
    is_published: true,
    available_from: item.availableFrom ?? null,
    available_until: item.availableUntil ?? null,
    metadata: item.metadata,
  };
}

function toPlaybackSourceInsert(source: IptvPlaybackSource) {
  return {
    item_id: source.itemId,
    provider: source.provider,
    source_type: source.sourceType,
    stream_url: source.streamUrl,
    embed_url: source.embedUrl ?? null,
    is_primary: source.isPrimary,
    is_live: source.isLive,
    drm_config: source.drmConfig,
    metadata: source.metadata,
  };
}

function toLiveEventInsert(event: IptvLiveEvent) {
  return {
    item_id: event.itemId,
    competition: event.competition,
    home_team: event.homeTeam ?? null,
    away_team: event.awayTeam ?? null,
    starts_at: event.startsAt,
    ends_at: event.endsAt ?? null,
    venue: event.venue ?? null,
    status: event.status,
    metadata: event.metadata,
  };
}

function getProviderName(): string {
  return trimEnv(process.env.IPTV_PROVIDER_NAME) ?? 'GameStop Managed IPTV';
}

function getCloudflareCustomerCode(): string | null {
  return (
    trimEnv(process.env.CF_STREAM_CUSTOMER_CODE) ??
    trimEnv(process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE) ??
    null
  );
}

async function createSignedCloudflareToken(streamUid: string): Promise<string | null> {
  const accountId = trimEnv(process.env.CF_STREAM_ACCOUNT_ID);
  const apiToken = trimEnv(process.env.CF_STREAM_API_TOKEN);
  if (!accountId || !apiToken) {
    return null;
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamUid}/token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 30 }),
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as { result?: { token?: string } };
  return data.result?.token ?? null;
}

function makeFallbackItems(): IptvCatalogItem[] {
  const uclStartAt =
    trimEnv(process.env.IPTV_UCL_EVENT_START_AT) ??
    new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'live-arena-1',
      kind: 'live_channel',
      title: 'Arena 1',
      slug: 'arena-1',
      synopsis:
        'Primary live channel slot for sports nights, premium fixtures, and marquee event windows.',
      badge: 'LIVE',
      genres: ['Live TV', 'Sports'],
      channelNumber: 101,
      isFeatured: true,
      metadata: {
        region: 'Kenya',
        note: 'Attach a licensed sports or event feed in Supabase playback sources.',
      },
    },
    {
      id: 'live-cinema',
      kind: 'live_channel',
      title: 'Cinema HD',
      slug: 'cinema-hd',
      synopsis:
        'A curated live movie channel slot for studio-licensed movie rotations and premieres.',
      badge: 'HD',
      genres: ['Live TV', 'Movies'],
      channelNumber: 202,
      isFeatured: true,
      metadata: {
        region: 'Global',
      },
    },
    {
      id: 'live-series',
      kind: 'live_channel',
      title: 'Series Central',
      slug: 'series-central',
      synopsis: 'Always-on channel for episodic drops, box sets, and binge-friendly daily blocks.',
      badge: '24/7',
      genres: ['Live TV', 'Series'],
      channelNumber: 305,
      isFeatured: false,
      metadata: {},
    },
    {
      id: 'sports-ucl-night',
      kind: 'sports_event',
      title: 'UEFA Champions League Night',
      slug: 'uefa-champions-league-night',
      synopsis:
        'Reserved event slot for licensed Champions League coverage. Add the approved provider feed to make this watchable.',
      badge: 'UCL',
      genres: ['Football', 'Live Sports'],
      isFeatured: true,
      availableFrom: uclStartAt,
      metadata: {
        rightsRequired: true,
      },
    },
    {
      id: 'movie-last-kickoff',
      kind: 'movie',
      title: 'The Last Kickoff',
      slug: 'the-last-kickoff',
      synopsis:
        'A retiring striker gets one final chance at continental glory while mentoring a rising academy star.',
      badge: 'New',
      genres: ['Sports', 'Drama'],
      releaseYear: 2026,
      durationMinutes: 122,
      maturityRating: '13+',
      isFeatured: true,
      metadata: {
        cloudflareEnv: 'CF_STREAM_UID_LAST_KICKOFF',
      },
    },
    {
      id: 'movie-silent-grid',
      kind: 'movie',
      title: 'Silent Grid',
      slug: 'silent-grid',
      synopsis:
        'When a citywide blackout knocks out mobile networks, a gamer-led crew uses analog radio and street maps to restore communications.',
      genres: ['Sci-Fi', 'Thriller'],
      releaseYear: 2025,
      durationMinutes: 110,
      maturityRating: '16+',
      isFeatured: true,
      metadata: {
        cloudflareEnv: 'CF_STREAM_UID_SILENT_GRID',
      },
    },
    {
      id: 'movie-market-day',
      kind: 'movie',
      title: 'Market Day',
      slug: 'market-day',
      synopsis:
        'A food vendor and a radio producer build a surprise local hit show while trying to keep a crowded market together.',
      genres: ['Drama', 'Comedy'],
      releaseYear: 2024,
      durationMinutes: 101,
      maturityRating: '13+',
      isFeatured: false,
      metadata: {
        cloudflareEnv: 'CF_STREAM_UID_MARKET_DAY',
      },
    },
    {
      id: 'series-pulse-city',
      kind: 'series',
      title: 'Pulse City',
      slug: 'pulse-city',
      synopsis:
        'A fast-moving Nairobi newsroom turns late-night tips into headline stories while holding together a family-owned station.',
      badge: 'Series',
      genres: ['Drama', 'Newsroom'],
      releaseYear: 2026,
      maturityRating: '13+',
      isFeatured: true,
      metadata: {
        seasons: 1,
      },
    },
    {
      id: 'pulse-city-s1e1',
      parentId: 'series-pulse-city',
      kind: 'episode',
      title: 'Pulse City: Episode 1',
      slug: 'pulse-city-s1e1',
      synopsis: 'The station lands a story that could double the audience or sink the business.',
      genres: ['Drama'],
      releaseYear: 2026,
      durationMinutes: 48,
      maturityRating: '13+',
      isFeatured: false,
      metadata: {
        seasonNumber: 1,
        episodeNumber: 1,
      },
    },
    {
      id: 'pulse-city-s1e2',
      parentId: 'series-pulse-city',
      kind: 'episode',
      title: 'Pulse City: Episode 2',
      slug: 'pulse-city-s1e2',
      synopsis: 'A leaked clip forces the team into a live-broadcast gamble.',
      genres: ['Drama'],
      releaseYear: 2026,
      durationMinutes: 46,
      maturityRating: '13+',
      isFeatured: false,
      metadata: {
        seasonNumber: 1,
        episodeNumber: 2,
      },
    },
  ];
}

function maybePushSource(
  target: IptvPlaybackSource[],
  next:
    | {
        itemId: string;
        provider: string;
        sourceType: IptvSourceType;
        streamUrl?: string;
        embedUrl?: string;
        isPrimary?: boolean;
        isLive?: boolean;
        metadata?: Record<string, unknown>;
      }
    | null
) {
  if (!next?.streamUrl) {
    return;
  }

  target.push({
    id: `${next.itemId}:${next.provider}:${next.sourceType}`,
    itemId: next.itemId,
    provider: next.provider,
    sourceType: next.sourceType,
    streamUrl: next.streamUrl,
    embedUrl: next.embedUrl,
    isPrimary: next.isPrimary ?? true,
    isLive: next.isLive ?? false,
    drmConfig: {},
    metadata: next.metadata ?? {},
  });
}

function makeFallbackSources(): IptvPlaybackSource[] {
  const providerName = getProviderName();
  const sources: IptvPlaybackSource[] = [];
  const signedPlayback = process.env.CF_STREAM_SIGNED_PLAYBACK === 'true';
  const uclIframeUrl = trimEnv(process.env.IPTV_UCL_EVENT_IFRAME_URL);
  const uclHlsUrl = trimEnv(process.env.IPTV_UCL_EVENT_HLS_URL);

  maybePushSource(sources, {
    itemId: 'live-arena-1',
    provider: providerName,
    sourceType: 'hls',
    streamUrl: trimEnv(process.env.IPTV_SAMPLE_LIVE_HLS_URL),
    isLive: true,
    metadata: {
      setupMode: 'env',
    },
  });

  maybePushSource(sources, {
    itemId: 'live-cinema',
    provider: providerName,
    sourceType: 'hls',
    streamUrl: trimEnv(process.env.IPTV_SAMPLE_CINEMA_HLS_URL),
    isLive: true,
    metadata: {
      setupMode: 'env',
    },
  });

  maybePushSource(sources, {
    itemId: 'sports-ucl-night',
    provider: providerName,
    sourceType: uclIframeUrl ? 'iframe' : 'hls',
    streamUrl: uclIframeUrl ?? uclHlsUrl,
    embedUrl: uclIframeUrl,
    isLive: true,
    metadata: {
      rightsRequired: true,
    },
  });

  const lastKickoffUid = trimEnv(process.env.CF_STREAM_UID_LAST_KICKOFF);
  const silentGridUid = trimEnv(process.env.CF_STREAM_UID_SILENT_GRID);
  const marketDayUid = trimEnv(process.env.CF_STREAM_UID_MARKET_DAY);
  const pulseEpisodeOneUid = trimEnv(process.env.IPTV_PULSE_CITY_EP1_STREAM_UID);
  const pulseEpisodeTwoUid = trimEnv(process.env.IPTV_PULSE_CITY_EP2_STREAM_UID);
  const lastKickoffPlayback = envPlaybackConfig(
    'MOVIE_PLAYBACK_TYPE_LAST_KICKOFF',
    'MOVIE_PLAYBACK_URL_LAST_KICKOFF',
    'MOVIE_PLAYBACK_EMBED_URL_LAST_KICKOFF',
    'MOVIE_PLAYBACK_PROVIDER_LAST_KICKOFF'
  );
  const silentGridPlayback = envPlaybackConfig(
    'MOVIE_PLAYBACK_TYPE_SILENT_GRID',
    'MOVIE_PLAYBACK_URL_SILENT_GRID',
    'MOVIE_PLAYBACK_EMBED_URL_SILENT_GRID',
    'MOVIE_PLAYBACK_PROVIDER_SILENT_GRID'
  );
  const marketDayPlayback = envPlaybackConfig(
    'MOVIE_PLAYBACK_TYPE_MARKET_DAY',
    'MOVIE_PLAYBACK_URL_MARKET_DAY',
    'MOVIE_PLAYBACK_EMBED_URL_MARKET_DAY',
    'MOVIE_PLAYBACK_PROVIDER_MARKET_DAY'
  );
  const pulseEpisodeOnePlayback = envPlaybackConfig(
    'IPTV_PULSE_CITY_EP1_PLAYBACK_TYPE',
    'IPTV_PULSE_CITY_EP1_PLAYBACK_URL',
    'IPTV_PULSE_CITY_EP1_PLAYBACK_EMBED_URL',
    'IPTV_PULSE_CITY_EP1_PLAYBACK_PROVIDER'
  );
  const pulseEpisodeTwoPlayback = envPlaybackConfig(
    'IPTV_PULSE_CITY_EP2_PLAYBACK_TYPE',
    'IPTV_PULSE_CITY_EP2_PLAYBACK_URL',
    'IPTV_PULSE_CITY_EP2_PLAYBACK_EMBED_URL',
    'IPTV_PULSE_CITY_EP2_PLAYBACK_PROVIDER'
  );

  maybePushSource(sources, {
    itemId: 'movie-last-kickoff',
    provider: lastKickoffPlayback.provider ?? 'Cloudflare Stream',
    sourceType: lastKickoffPlayback.sourceType ?? 'cloudflare_stream',
    streamUrl: lastKickoffPlayback.streamUrl ?? lastKickoffUid,
    embedUrl: lastKickoffPlayback.embedUrl,
    isLive: false,
    metadata:
      lastKickoffPlayback.sourceType && lastKickoffPlayback.sourceType !== 'cloudflare_stream'
        ? {}
        : {
            requiresSignedPlayback: signedPlayback,
          },
  });

  maybePushSource(sources, {
    itemId: 'movie-silent-grid',
    provider: silentGridPlayback.provider ?? 'Cloudflare Stream',
    sourceType: silentGridPlayback.sourceType ?? 'cloudflare_stream',
    streamUrl: silentGridPlayback.streamUrl ?? silentGridUid,
    embedUrl: silentGridPlayback.embedUrl,
    isLive: false,
    metadata:
      silentGridPlayback.sourceType && silentGridPlayback.sourceType !== 'cloudflare_stream'
        ? {}
        : {
            requiresSignedPlayback: signedPlayback,
          },
  });

  maybePushSource(sources, {
    itemId: 'movie-market-day',
    provider: marketDayPlayback.provider ?? 'Cloudflare Stream',
    sourceType: marketDayPlayback.sourceType ?? 'cloudflare_stream',
    streamUrl: marketDayPlayback.streamUrl ?? marketDayUid,
    embedUrl: marketDayPlayback.embedUrl,
    isLive: false,
    metadata:
      marketDayPlayback.sourceType && marketDayPlayback.sourceType !== 'cloudflare_stream'
        ? {}
        : {
            requiresSignedPlayback: signedPlayback,
          },
  });

  maybePushSource(sources, {
    itemId: 'pulse-city-s1e1',
    provider: pulseEpisodeOnePlayback.provider ?? 'Cloudflare Stream',
    sourceType: pulseEpisodeOnePlayback.sourceType ?? 'cloudflare_stream',
    streamUrl: pulseEpisodeOnePlayback.streamUrl ?? pulseEpisodeOneUid,
    embedUrl: pulseEpisodeOnePlayback.embedUrl,
    isLive: false,
    metadata:
      pulseEpisodeOnePlayback.sourceType && pulseEpisodeOnePlayback.sourceType !== 'cloudflare_stream'
        ? {}
        : {
            requiresSignedPlayback: signedPlayback,
          },
  });

  maybePushSource(sources, {
    itemId: 'pulse-city-s1e2',
    provider: pulseEpisodeTwoPlayback.provider ?? 'Cloudflare Stream',
    sourceType: pulseEpisodeTwoPlayback.sourceType ?? 'cloudflare_stream',
    streamUrl: pulseEpisodeTwoPlayback.streamUrl ?? pulseEpisodeTwoUid,
    embedUrl: pulseEpisodeTwoPlayback.embedUrl,
    isLive: false,
    metadata:
      pulseEpisodeTwoPlayback.sourceType && pulseEpisodeTwoPlayback.sourceType !== 'cloudflare_stream'
        ? {}
        : {
            requiresSignedPlayback: signedPlayback,
          },
  });

  return sources;
}

function makeFallbackEvents(): IptvLiveEvent[] {
  const startsAt =
    trimEnv(process.env.IPTV_UCL_EVENT_START_AT) ??
    new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  return [
    {
      itemId: 'sports-ucl-night',
      competition: 'UEFA Champions League',
      homeTeam: trimEnv(process.env.IPTV_UCL_HOME_TEAM) ?? 'Home Team',
      awayTeam: trimEnv(process.env.IPTV_UCL_AWAY_TEAM) ?? 'Away Team',
      startsAt,
      venue: trimEnv(process.env.IPTV_UCL_VENUE) ?? 'Provider-defined venue',
      status: 'scheduled',
      metadata: {
        note: 'Configure a rights-cleared live source before exposing this slot.',
      },
    },
  ];
}

function getSyntheticCatalogMetadata(itemId: string): Record<string, unknown> {
  switch (itemId) {
    case 'movie-last-kickoff':
      return { tmdbTitle: 'Creed', tmdbType: 'movie' };
    case 'movie-silent-grid':
      return { tmdbTitle: 'Inception', tmdbType: 'movie' };
    case 'movie-market-day':
      return { tmdbTitle: 'Chef', tmdbType: 'movie' };
    case 'series-pulse-city':
      return { tmdbTitle: 'The Newsroom', tmdbType: 'tv' };
    default:
      return {};
  }
}

function getMergedCatalogMetadata(item: IptvCatalogItem): Record<string, unknown> {
  return {
    ...getSyntheticCatalogMetadata(item.id),
    ...item.metadata,
  };
}

function inferTmdbMediaType(item: IptvCatalogItem, metadata: Record<string, unknown>): TmdbMediaType | null {
  const explicit = tmdbMediaTypeFromUnknown(metadata.tmdbType);
  if (explicit) {
    return explicit;
  }

  if (item.kind === 'movie') {
    return 'movie';
  }

  if (item.kind === 'series' || item.kind === 'episode') {
    return 'tv';
  }

  return null;
}

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function yearFromDateString(value: string | undefined): number | undefined {
  const year = Number((value ?? '').slice(0, 4));
  return Number.isFinite(year) && year > 1800 ? year : undefined;
}

function pickTmdbSearchResult(
  results: TmdbItem[],
  mediaType: TmdbMediaType,
  title: string,
  releaseYear?: number
): TmdbItem | null {
  const normalizedTitle = normalizeTitle(title);
  const candidates = results
    .filter((result) => {
      const resultType =
        result.media_type === 'movie' || result.media_type === 'tv'
          ? result.media_type
          : mediaType;
      return resultType === mediaType;
    })
    .map((result) => {
      const resultTitle = result.title ?? result.name ?? '';
      const normalizedResultTitle = normalizeTitle(resultTitle);
      const resultYear = yearFromDateString(
        mediaType === 'movie' ? result.release_date : result.first_air_date
      );

      let score = result.vote_average ?? 0;
      if (normalizedResultTitle === normalizedTitle) {
        score += 100;
      } else if (
        normalizedResultTitle.includes(normalizedTitle) ||
        normalizedTitle.includes(normalizedResultTitle)
      ) {
        score += 30;
      }

      if (releaseYear && resultYear === releaseYear) {
        score += 20;
      }

      return { result, score };
    })
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.result ?? null;
}

async function enrichCatalogItems(items: IptvCatalogItem[]): Promise<IptvCatalogItem[]> {
  const itemsById = new Map(items.map((item) => [item.id, item]));

  if (!isTmdbConfigured()) {
    return items.map((item) => {
      const metadata = getMergedCatalogMetadata(item);
      return {
        ...item,
        metadata,
        voteAverage: item.voteAverage ?? numberFromUnknown(metadata.voteAverage),
        tagline: item.tagline ?? stringFromUnknown(metadata.tagline),
        tmdbId: item.tmdbId ?? numberFromUnknown(metadata.tmdbId),
        tmdbType: item.tmdbType ?? tmdbMediaTypeFromUnknown(metadata.tmdbType),
        imdbId: item.imdbId ?? stringFromUnknown(metadata.imdbId),
      };
    });
  }

  const bindingCache = new Map<string, Promise<ResolvedTmdbBinding | null>>();
  const searchCache = new Map<string, Promise<TmdbItem[]>>();
  const detailsCache = new Map<string, Promise<Awaited<ReturnType<typeof getDetails>>>>();
  const episodeCache = new Map<string, Promise<Awaited<ReturnType<typeof getEpisodeDetails>>>>();

  const searchByTitle = async (title: string): Promise<TmdbItem[]> => {
    const cacheKey = title.toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const pending = searchMulti(title).then((data) => data?.results ?? []);
    searchCache.set(cacheKey, pending);
    return pending;
  };

  const getDetailsCached = async (mediaType: TmdbMediaType, tmdbId: number) => {
    const cacheKey = `${mediaType}:${tmdbId}`;
    const cached = detailsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const pending = getDetails(mediaType, tmdbId);
    detailsCache.set(cacheKey, pending);
    return pending;
  };

  const getEpisodeDetailsCached = async (
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number
  ) => {
    const cacheKey = `${tmdbId}:${seasonNumber}:${episodeNumber}`;
    const cached = episodeCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const pending = getEpisodeDetails(tmdbId, seasonNumber, episodeNumber);
    episodeCache.set(cacheKey, pending);
    return pending;
  };

  const resolveBinding = async (item: IptvCatalogItem): Promise<ResolvedTmdbBinding | null> => {
    const cached = bindingCache.get(item.id);
    if (cached) {
      return cached;
    }

    const pending = (async () => {
      const metadata = getMergedCatalogMetadata(item);
      const mediaType = inferTmdbMediaType(item, metadata);
      const explicitTmdbId = numberFromUnknown(metadata.tmdbId);
      const imdbId = stringFromUnknown(metadata.imdbId);

      if (explicitTmdbId && mediaType) {
        return { mediaType, tmdbId: explicitTmdbId, imdbId };
      }

      if (imdbId) {
        const resolved = await findByImdbId(imdbId, mediaType ?? undefined);
        if (resolved) {
          return {
            mediaType: resolved.mediaType,
            tmdbId: resolved.item.id,
            imdbId,
          };
        }
      }

      if (item.kind === 'episode' && item.parentId) {
        const parent = itemsById.get(item.parentId);
        if (!parent) {
          return null;
        }

        const parentBinding = await resolveBinding(parent);
        return parentBinding?.mediaType === 'tv' ? parentBinding : null;
      }

      if (!mediaType || (item.kind !== 'movie' && item.kind !== 'series')) {
        return null;
      }

      const searchTitle = stringFromUnknown(metadata.tmdbTitle) ?? item.title;
      const results = await searchByTitle(searchTitle);
      const match = pickTmdbSearchResult(results, mediaType, searchTitle, item.releaseYear);

      if (!match) {
        return null;
      }

      return {
        mediaType,
        tmdbId: match.id,
        imdbId,
      };
    })();

    bindingCache.set(item.id, pending);
    return pending;
  };

  return Promise.all(
    items.map(async (item) => {
      const metadata = getMergedCatalogMetadata(item);
      const baseItem: IptvCatalogItem = {
        ...item,
        metadata,
        voteAverage: item.voteAverage ?? numberFromUnknown(metadata.voteAverage),
        tagline: item.tagline ?? stringFromUnknown(metadata.tagline),
        tmdbId: item.tmdbId ?? numberFromUnknown(metadata.tmdbId),
        tmdbType: item.tmdbType ?? tmdbMediaTypeFromUnknown(metadata.tmdbType),
        imdbId: item.imdbId ?? stringFromUnknown(metadata.imdbId),
      };

      const binding = await resolveBinding(item);
      if (!binding) {
        return baseItem;
      }

      if (item.kind === 'episode') {
        const seasonNumber = numberFromUnknown(metadata.seasonNumber);
        const episodeNumber = numberFromUnknown(metadata.episodeNumber);
        if (!seasonNumber || !episodeNumber) {
          return {
            ...baseItem,
            tmdbId: binding.tmdbId,
            tmdbType: binding.mediaType,
            imdbId: binding.imdbId ?? baseItem.imdbId,
            metadata: {
              ...metadata,
              tmdbId: binding.tmdbId,
              tmdbType: binding.mediaType,
              ...(binding.imdbId ? { imdbId: binding.imdbId } : {}),
            },
          };
        }

        const [episodeDetails, parentSeries] = await Promise.all([
          getEpisodeDetailsCached(binding.tmdbId, seasonNumber, episodeNumber),
          getDetailsCached('tv', binding.tmdbId),
        ]);

        const seriesGenres = parentSeries?.genres.map((genre) => genre.name) ?? [];
        const voteAverage =
          episodeDetails?.vote_average && episodeDetails.vote_average > 0
            ? episodeDetails.vote_average
            : baseItem.voteAverage;

        return {
          ...baseItem,
          title: episodeDetails?.name || baseItem.title,
          synopsis: episodeDetails?.overview || baseItem.synopsis,
          posterUrl:
            baseItem.posterUrl ||
            (parentSeries?.poster_path ? tmdbPoster(parentSeries.poster_path) : undefined),
          backdropUrl:
            baseItem.backdropUrl ||
            (episodeDetails?.still_path
              ? tmdbBackdrop(episodeDetails.still_path)
              : parentSeries?.backdrop_path
                ? tmdbBackdrop(parentSeries.backdrop_path)
                : undefined),
          genres: seriesGenres.length > 0 ? seriesGenres : baseItem.genres,
          releaseYear: baseItem.releaseYear ?? yearFromDateString(episodeDetails?.air_date),
          durationMinutes: baseItem.durationMinutes ?? episodeDetails?.runtime,
          voteAverage,
          tmdbId: binding.tmdbId,
          tmdbType: 'tv',
          imdbId: binding.imdbId ?? baseItem.imdbId,
          metadata: {
            ...metadata,
            tmdbId: binding.tmdbId,
            tmdbType: 'tv',
            ...(binding.imdbId ? { imdbId: binding.imdbId } : {}),
            ...(voteAverage ? { voteAverage } : {}),
            tmdbBound: true,
          },
        };
      }

      const details = await getDetailsCached(binding.mediaType, binding.tmdbId);
      if (!details) {
        return {
          ...baseItem,
          tmdbId: binding.tmdbId,
          tmdbType: binding.mediaType,
          imdbId: binding.imdbId ?? baseItem.imdbId,
          metadata: {
            ...metadata,
            tmdbId: binding.tmdbId,
            tmdbType: binding.mediaType,
            ...(binding.imdbId ? { imdbId: binding.imdbId } : {}),
          },
        };
      }

      const genres = details.genres.map((genre) => genre.name);
      const voteAverage =
        details.vote_average && details.vote_average > 0 ? details.vote_average : baseItem.voteAverage;

      return {
        ...baseItem,
        title: details.title ?? details.name ?? baseItem.title,
        synopsis: details.overview || baseItem.synopsis,
        posterUrl: baseItem.posterUrl || (details.poster_path ? tmdbPoster(details.poster_path) : undefined),
        backdropUrl:
          baseItem.backdropUrl || (details.backdrop_path ? tmdbBackdrop(details.backdrop_path) : undefined),
        genres: genres.length > 0 ? genres : baseItem.genres,
        releaseYear:
          baseItem.releaseYear ??
          yearFromDateString(details.release_date ?? details.first_air_date),
        durationMinutes: baseItem.durationMinutes ?? details.runtime,
        tagline: baseItem.tagline ?? details.tagline ?? undefined,
        voteAverage,
        tmdbId: binding.tmdbId,
        tmdbType: binding.mediaType,
        imdbId: binding.imdbId ?? baseItem.imdbId,
        metadata: {
          ...metadata,
          tmdbId: binding.tmdbId,
          tmdbType: binding.mediaType,
          ...(binding.imdbId ? { imdbId: binding.imdbId } : {}),
          ...(details.status ? { tmdbStatus: details.status } : {}),
          ...(details.number_of_seasons ? { seasons: details.number_of_seasons } : {}),
          ...(voteAverage ? { voteAverage } : {}),
          ...(details.tagline ? { tagline: details.tagline } : {}),
          tmdbBound: true,
        },
      };
    })
  );
}

function compareByOptionalNumber(a?: number, b?: number): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  if (typeof a === 'number') {
    return -1;
  }

  if (typeof b === 'number') {
    return 1;
  }

  return 0;
}

function compareEntries(a: IptvCatalogEntry, b: IptvCatalogEntry): number {
  if (a.kind === 'live_channel' && b.kind === 'live_channel') {
    const channelDiff = compareByOptionalNumber(a.channelNumber, b.channelNumber);
    if (channelDiff !== 0) {
      return channelDiff;
    }
  }

  if (a.kind === 'sports_event' && b.kind === 'sports_event') {
    const aTime = a.liveEvent?.startsAt ?? a.availableFrom ?? '';
    const bTime = b.liveEvent?.startsAt ?? b.availableFrom ?? '';
    if (aTime !== bTime) {
      return aTime.localeCompare(bTime);
    }
  }

  if (a.kind === 'movie' && b.kind === 'movie') {
    const aYear = a.releaseYear ?? 0;
    const bYear = b.releaseYear ?? 0;
    if (aYear !== bYear) {
      return bYear - aYear;
    }
  }

  if (a.kind === 'episode' && b.kind === 'episode') {
    const aSeason = Number(a.metadata.seasonNumber ?? 0);
    const bSeason = Number(b.metadata.seasonNumber ?? 0);
    if (aSeason !== bSeason) {
      return aSeason - bSeason;
    }

    const aEpisode = Number(a.metadata.episodeNumber ?? 0);
    const bEpisode = Number(b.metadata.episodeNumber ?? 0);
    if (aEpisode !== bEpisode) {
      return aEpisode - bEpisode;
    }
  }

  return a.title.localeCompare(b.title);
}

function buildCatalogEntries(
  items: IptvCatalogItem[],
  sources: IptvPlaybackSource[],
  events: IptvLiveEvent[]
): {
  topLevel: IptvCatalogEntry[];
  allEntries: IptvCatalogEntry[];
} {
  const sourcesByItemId = new Map<string, IptvPlaybackSource[]>();
  for (const source of sources) {
    const current = sourcesByItemId.get(source.itemId) ?? [];
    current.push(source);
    current.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
    sourcesByItemId.set(source.itemId, current);
  }

  const eventsByItemId = new Map(events.map((event) => [event.itemId, event]));
  const entryById = new Map<string, IptvCatalogEntry>();

  for (const item of items) {
    entryById.set(item.id, {
      ...item,
      sources: sourcesByItemId.get(item.id) ?? [],
      liveEvent: eventsByItemId.get(item.id),
      episodes: [],
    });
  }

  for (const entry of entryById.values()) {
    if (entry.kind !== 'episode' || !entry.parentId) {
      continue;
    }

    const parent = entryById.get(entry.parentId);
    if (!parent) {
      continue;
    }

    parent.episodes.push(entry);
  }

  for (const entry of entryById.values()) {
    entry.episodes.sort(compareEntries);
  }

  const allEntries = Array.from(entryById.values()).sort(compareEntries);
  const topLevel = allEntries.filter((entry) => entry.kind !== 'episode');

  return { topLevel, allEntries };
}

async function loadRowsFromSupabase(): Promise<{
  items: IptvCatalogItem[];
  sources: IptvPlaybackSource[];
  events: IptvLiveEvent[];
} | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const loadRows = async () => {
    const { data: itemData, error: itemError } = await supabase
      .from('iptv_catalog_items')
      .select(
        'id, parent_id, kind, title, slug, synopsis, poster_url, backdrop_url, logo_url, badge, genres, territory, release_year, duration_minutes, maturity_rating, channel_number, is_featured, available_from, available_until, metadata'
      )
      .eq('is_published', true);

    if (itemError || !itemData || itemData.length === 0) {
      return null;
    }

    const itemIds = (itemData as CatalogItemRow[]).map((row) => row.id);

    const [sourceResult, eventResult] = await Promise.all([
      supabase
        .from('iptv_playback_sources')
        .select(
          'id, item_id, provider, source_type, stream_url, embed_url, is_primary, is_live, drm_config, metadata'
        )
        .in('item_id', itemIds),
      supabase
        .from('iptv_live_events')
        .select(
          'item_id, competition, home_team, away_team, starts_at, ends_at, venue, status, metadata'
        )
        .in('item_id', itemIds),
    ]);

    return {
      items: (itemData as CatalogItemRow[]).map(toCatalogItem),
      sources: (sourceResult.data as PlaybackSourceRow[] | null)?.map(toPlaybackSource) ?? [],
      events: (eventResult.data as LiveEventRow[] | null)?.map(toLiveEvent) ?? [],
    };
  };

  const existing = await loadRows();
  if (existing) {
    return existing;
  }

  const fallbackItems = makeFallbackItems();
  const fallbackSources = makeFallbackSources();
  const fallbackEvents = makeFallbackEvents();

  const { error: insertItemsError } = await supabase.from('iptv_catalog_items').upsert(
    fallbackItems.map(toCatalogItemInsert),
    { onConflict: 'id' }
  );

  if (insertItemsError) {
    return null;
  }

  if (fallbackSources.length > 0) {
    await supabase.from('iptv_playback_sources').upsert(
      fallbackSources.map(toPlaybackSourceInsert),
      { onConflict: 'item_id,provider,source_type,stream_url' }
    );
  }

  if (fallbackEvents.length > 0) {
    await supabase.from('iptv_live_events').upsert(
      fallbackEvents.map(toLiveEventInsert),
      { onConflict: 'item_id' }
    );
  }

  return (await loadRows()) ?? {
    items: fallbackItems,
    sources: fallbackSources,
    events: fallbackEvents,
  };
}

async function loadCatalogData() {
  const supabaseRows = await loadRowsFromSupabase();
  const baseRows =
    supabaseRows ??
    {
    items: makeFallbackItems(),
    sources: makeFallbackSources(),
    events: makeFallbackEvents(),
    };

  return {
    ...baseRows,
    items: await enrichCatalogItems(baseRows.items),
  };
}

async function getCatalogIndex() {
  const { items, sources, events } = await loadCatalogData();
  return buildCatalogEntries(items, sources, events);
}

export async function getIptvCatalogSections(): Promise<IptvCatalogSections> {
  const { topLevel } = await getCatalogIndex();
  const featured = topLevel.filter((entry) => entry.isFeatured).slice(0, 6);
  const liveChannels = topLevel.filter((entry) => entry.kind === 'live_channel');
  const movies = topLevel.filter((entry) => entry.kind === 'movie');
  const series = topLevel.filter((entry) => entry.kind === 'series');
  const sportsEvents = topLevel.filter((entry) => entry.kind === 'sports_event');

  return {
    featured,
    liveChannels,
    movies,
    series,
    sportsEvents,
    counts: {
      liveChannels: liveChannels.length,
      movies: movies.length,
      series: series.length,
      sportsEvents: sportsEvents.length,
      totalTopLevel: topLevel.length,
    },
  };
}

function getPrimarySource(entry: IptvCatalogEntry): IptvPlaybackSource | null {
  return entry.sources.find((source) => source.isPrimary) ?? entry.sources[0] ?? null;
}

function getSeriesForEpisode(
  item: IptvCatalogEntry,
  entries: IptvCatalogEntry[]
): IptvCatalogEntry | undefined {
  if (item.kind !== 'episode' || !item.parentId) {
    return undefined;
  }

  return entries.find((entry) => entry.id === item.parentId && entry.kind === 'series');
}

function getDefaultPlaybackEntry(item: IptvCatalogEntry): IptvCatalogEntry | null {
  if (item.sources.length > 0) {
    return item;
  }

  if (item.kind === 'series') {
    return item.episodes.find((episode) => episode.sources.length > 0) ?? item.episodes[0] ?? null;
  }

  return null;
}

export async function getCatalogWatchContext(slug: string): Promise<IptvWatchContext | null> {
  const { allEntries } = await getCatalogIndex();
  const item = allEntries.find((entry) => entry.slug === slug);
  if (!item) {
    return null;
  }

  const playbackEntry = getDefaultPlaybackEntry(item);
  if (!playbackEntry) {
    return {
      item,
      playbackEntry: item,
      playback: null,
      relatedEpisodes: item.kind === 'series' ? item.episodes : [],
      parentSeries: getSeriesForEpisode(item, allEntries),
    };
  }

  return {
    item,
    playbackEntry,
    playback: await resolveCatalogPlayback(playbackEntry),
    relatedEpisodes:
      item.kind === 'series'
        ? item.episodes
        : item.kind === 'episode'
          ? getSeriesForEpisode(item, allEntries)?.episodes ?? []
          : [],
    parentSeries: getSeriesForEpisode(item, allEntries),
  };
}

export function hasConfiguredPlayback(item: IptvCatalogEntry): boolean {
  return item.sources.length > 0 || item.episodes.some((episode) => episode.sources.length > 0);
}

export async function resolveCatalogPlayback(
  entry: IptvCatalogEntry
): Promise<ResolvedCatalogPlaybackSource | null> {
  const source = getPrimarySource(entry);
  if (!source) {
    return null;
  }

  if (source.sourceType === 'iframe') {
    return {
      provider: source.provider,
      sourceType: source.sourceType,
      playbackMode: 'iframe',
      iframeUrl: source.embedUrl ?? source.streamUrl,
      externalUrl: source.streamUrl,
      signed: false,
      isLive: source.isLive,
    };
  }

  if (source.sourceType === 'hls') {
    return {
      provider: source.provider,
      sourceType: source.sourceType,
      playbackMode: 'video',
      videoUrl: source.streamUrl,
      hlsUrl: source.streamUrl,
      signed: false,
      isLive: source.isLive,
    };
  }

  if (source.sourceType === 'dash') {
    return {
      provider: source.provider,
      sourceType: source.sourceType,
      playbackMode: 'external',
      externalUrl: source.streamUrl,
      dashUrl: source.streamUrl,
      signed: false,
      isLive: source.isLive,
    };
  }

  if (source.sourceType === 'external_link') {
    return {
      provider: source.provider,
      sourceType: source.sourceType,
      playbackMode: source.embedUrl ? 'iframe' : 'external',
      iframeUrl: source.embedUrl,
      externalUrl: source.streamUrl,
      signed: false,
      isLive: source.isLive,
    };
  }

  const customerCode = getCloudflareCustomerCode();
  if (!customerCode) {
    return null;
  }

  const requiresSignedPlayback = source.metadata.requiresSignedPlayback === true;
  let playbackKey = source.streamUrl;
  let signed = false;

  if (requiresSignedPlayback) {
    const token = await createSignedCloudflareToken(source.streamUrl);
    if (!token) {
      return null;
    }

    playbackKey = token;
    signed = true;
  }

  return {
    provider: source.provider,
    sourceType: source.sourceType,
    playbackMode: 'iframe',
    iframeUrl: `https://customer-${customerCode}.cloudflarestream.com/${playbackKey}/iframe`,
    hlsUrl: `https://customer-${customerCode}.cloudflarestream.com/${playbackKey}/manifest/video.m3u8`,
    dashUrl: `https://customer-${customerCode}.cloudflarestream.com/${playbackKey}/manifest/video.mpd`,
    signed,
    isLive: source.isLive,
  };
}

export async function getPlaylistEntries(): Promise<IptvPlaylistEntry[]> {
  const { topLevel } = await getCatalogIndex();
  const entries = topLevel.flatMap((entry) => {
    if (entry.kind === 'series') {
      return entry.episodes;
    }

    return [entry];
  });

  const playlistEntries: IptvPlaylistEntry[] = [];

  for (const entry of entries) {
    const source = getPrimarySource(entry);
    if (!source) {
      continue;
    }

    if (source.sourceType === 'iframe' || source.sourceType === 'external_link') {
      continue;
    }

    if (source.sourceType === 'cloudflare_stream') {
      const customerCode = getCloudflareCustomerCode();
      const requiresSignedPlayback = source.metadata.requiresSignedPlayback === true;
      if (!customerCode || requiresSignedPlayback) {
        continue;
      }

      playlistEntries.push({
        id: entry.slug,
        title: entry.title,
        groupTitle:
          entry.kind === 'movie'
            ? 'Movies'
            : entry.kind === 'episode'
              ? 'Series'
              : entry.kind === 'sports_event'
                ? 'Sports'
                : 'Live TV',
        logoUrl: entry.logoUrl ?? entry.posterUrl,
        url: `https://customer-${customerCode}.cloudflarestream.com/${source.streamUrl}/manifest/video.m3u8`,
      });
      continue;
    }

    playlistEntries.push({
      id: entry.slug,
      title: entry.title,
      groupTitle:
        entry.kind === 'movie'
          ? 'Movies'
          : entry.kind === 'episode'
            ? 'Series'
            : entry.kind === 'sports_event'
              ? 'Sports'
              : 'Live TV',
      logoUrl: entry.logoUrl ?? entry.posterUrl,
      url: source.streamUrl,
    });
  }

  return playlistEntries;
}

export function formatPlaylist(entries: IptvPlaylistEntry[]): string {
  const lines = ['#EXTM3U'];

  for (const entry of entries) {
    const attrs = [
      `tvg-id="${entry.id}"`,
      `tvg-name="${entry.title.replace(/"/g, "'")}"`,
      entry.logoUrl ? `tvg-logo="${entry.logoUrl.replace(/"/g, "'")}"` : null,
      `group-title="${entry.groupTitle.replace(/"/g, "'")}"`,
    ].filter(Boolean);

    lines.push(`#EXTINF:-1 ${attrs.join(' ')},${entry.title}`);
    lines.push(entry.url);
  }

  return `${lines.join('\n')}\n`;
}
