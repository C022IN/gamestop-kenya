import 'server-only';

export interface IptvOrgChannel {
  id: string;
  name: string;
  logoUrl: string;
  streamUrl: string;
  category: string;
  country: string;
  languages: string[];
  isNsfw: boolean;
}

/**
 * Parse a raw M3U playlist string into structured channel entries.
 * Handles EXTINF attributes: tvg-id, tvg-name, tvg-logo, group-title.
 */
export function parseM3u(text: string): IptvOrgChannel[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const channels: IptvOrgChannel[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('#EXTINF')) continue;

    const urlLine = lines[i + 1];
    if (!urlLine || urlLine.startsWith('#')) continue;

    const idMatch = line.match(/tvg-id="([^"]*)"/);
    const nameMatch = line.match(/tvg-name="([^"]*)"/);
    const logoMatch = line.match(/tvg-logo="([^"]*)"/);
    const groupMatch = line.match(/group-title="([^"]*)"/);
    const countryMatch = line.match(/tvg-country="([^"]*)"/);
    const langMatch = line.match(/tvg-language="([^"]*)"/);

    // fallback name: text after last comma in EXTINF line
    const commaIdx = line.lastIndexOf(',');
    const fallbackName = commaIdx !== -1 ? line.slice(commaIdx + 1).trim() : 'Unknown';

    const name = nameMatch?.[1] || fallbackName;
    if (!name || !urlLine.startsWith('http')) continue;

    channels.push({
      id: idMatch?.[1] || `ch-${i}`,
      name,
      logoUrl: logoMatch?.[1] || '',
      streamUrl: urlLine,
      category: (groupMatch?.[1] || 'General').trim(),
      country: (countryMatch?.[1] || '').trim(),
      languages: langMatch?.[1] ? langMatch[1].split(';').map((l) => l.trim()) : [],
      isNsfw: false,
    });
  }

  return channels;
}

const RAW = 'https://raw.githubusercontent.com/iptv-org/iptv/master';

/** Map of category slug → iptv-org raw GitHub playlist URL */
export const CHANNEL_CATEGORIES: Record<string, { label: string; url: string; emoji: string }> = {
  sports:        { label: 'Sports',        url: `${RAW}/streams/index.category.sports.m3u`,        emoji: '⚽' },
  news:          { label: 'News',          url: `${RAW}/streams/index.category.news.m3u`,          emoji: '📰' },
  entertainment: { label: 'Entertainment', url: `${RAW}/streams/index.category.entertainment.m3u`, emoji: '🎭' },
  movies:        { label: 'Movies',        url: `${RAW}/streams/index.category.movies.m3u`,        emoji: '🎬' },
  music:         { label: 'Music',         url: `${RAW}/streams/index.category.music.m3u`,         emoji: '🎵' },
  kids:          { label: 'Kids',          url: `${RAW}/streams/index.category.kids.m3u`,          emoji: '🧒' },
  documentary:   { label: 'Documentary',   url: `${RAW}/streams/index.category.documentary.m3u`,   emoji: '🎥' },
  religious:     { label: 'Religious',     url: `${RAW}/streams/index.category.religious.m3u`,     emoji: '✝️' },
  kenya:         { label: 'Kenya',         url: `${RAW}/streams/index.country.ke.m3u`,             emoji: '🇰🇪' },
  africa:        { label: 'Africa',        url: `${RAW}/streams/index.region.Africa.m3u`,          emoji: '🌍' },
};

/** Fetch and parse an M3U playlist. Results are cached by Next.js for 1 hour. */
export async function fetchCategoryChannels(
  categoryKey: string,
  limit = 60
): Promise<IptvOrgChannel[]> {
  const cat = CHANNEL_CATEGORIES[categoryKey];
  if (!cat) return [];

  try {
    const res = await fetch(cat.url, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'GameStopKenya-IPTV/1.0' },
    });
    if (!res.ok) return [];
    const text = await res.text();
    const channels = parseM3u(text).filter((ch) => !ch.isNsfw);
    return channels.slice(0, limit);
  } catch {
    return [];
  }
}

/** Fetch multiple categories in parallel */
export async function fetchMultipleCategories(
  categories: string[],
  limitPerCategory = 40
): Promise<Record<string, IptvOrgChannel[]>> {
  const results = await Promise.all(
    categories.map(async (cat) => [cat, await fetchCategoryChannels(cat, limitPerCategory)] as const)
  );
  return Object.fromEntries(results);
}
