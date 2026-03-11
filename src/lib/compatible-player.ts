function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function envFlag(name: string, defaultValue = false) {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) {
    return defaultValue;
  }

  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

export interface CompatiblePlayerOptions {
  color?: string;
  progress?: number;
  nextEpisode?: boolean;
  episodeSelector?: boolean;
  autoplayNextEpisode?: boolean;
  overlay?: boolean;
  dub?: boolean;
}

export function getCompatiblePlayerBaseUrl() {
  const raw = process.env.COMPATIBLE_PLAYER_BASE_URL?.trim() ?? '';
  return raw ? trimTrailingSlash(raw) : '';
}

export function getCompatiblePlayerOrigin() {
  const baseUrl = getCompatiblePlayerBaseUrl();
  if (!baseUrl) {
    return null;
  }

  try {
    return new URL(baseUrl).origin;
  } catch {
    return null;
  }
}

export function isCompatiblePlayerConfigured() {
  return Boolean(getCompatiblePlayerBaseUrl());
}

export function getDefaultCompatiblePlayerOptions(): CompatiblePlayerOptions {
  return {
    color: process.env.COMPATIBLE_PLAYER_COLOR?.trim().replace(/^#/, '') || undefined,
    nextEpisode: envFlag('COMPATIBLE_PLAYER_NEXT_EPISODE', true),
    episodeSelector: envFlag('COMPATIBLE_PLAYER_EPISODE_SELECTOR', true),
    autoplayNextEpisode: envFlag('COMPATIBLE_PLAYER_AUTOPLAY_NEXT_EPISODE', true),
    overlay: envFlag('COMPATIBLE_PLAYER_OVERLAY', true),
  };
}

function appendOptions(url: URL, options: CompatiblePlayerOptions = {}) {
  if (options.color) {
    url.searchParams.set('color', options.color.replace(/^#/, ''));
  }

  if (typeof options.progress === 'number' && Number.isFinite(options.progress) && options.progress > 0) {
    url.searchParams.set('progress', String(Math.floor(options.progress)));
  }

  if (options.nextEpisode) {
    url.searchParams.set('nextEpisode', 'true');
  }

  if (options.episodeSelector) {
    url.searchParams.set('episodeSelector', 'true');
  }

  if (options.autoplayNextEpisode) {
    url.searchParams.set('autoplayNextEpisode', 'true');
  }

  if (options.overlay) {
    url.searchParams.set('overlay', 'true');
  }

  if (options.dub) {
    url.searchParams.set('dub', 'true');
  }

  return url;
}

export function buildCompatibleMoviePlayerUrl(
  movieId: number,
  options: CompatiblePlayerOptions = {}
) {
  const baseUrl = getCompatiblePlayerBaseUrl();
  if (!baseUrl) {
    return null;
  }

  return appendOptions(new URL(`${baseUrl}/movie/${movieId}`), options).toString();
}

export function buildCompatibleTvPlayerUrl(
  showId: number,
  seasonNumber: number,
  episodeNumber: number,
  options: CompatiblePlayerOptions = {}
) {
  const baseUrl = getCompatiblePlayerBaseUrl();
  if (!baseUrl) {
    return null;
  }

  return appendOptions(
    new URL(`${baseUrl}/tv/${showId}/${seasonNumber}/${episodeNumber}`),
    options
  ).toString();
}

export function buildCompatibleAnimePlayerUrl(
  anilistId: number,
  options: CompatiblePlayerOptions & { episodeNumber?: number } = {}
) {
  const baseUrl = getCompatiblePlayerBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const path = options.episodeNumber
    ? `${baseUrl}/anime/${anilistId}/${options.episodeNumber}`
    : `${baseUrl}/anime/${anilistId}`;

  return appendOptions(new URL(path), options).toString();
}
