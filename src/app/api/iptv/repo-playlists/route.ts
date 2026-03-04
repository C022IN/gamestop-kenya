import { NextRequest, NextResponse } from 'next/server';

// iptv-org GitHub Pages playlist URL patterns
const BASE = 'https://iptv-org.github.io/playlists';

export interface RepoPlaylist {
  label: string;
  url: string;
  type: 'country' | 'category' | 'all';
  code: string;
}

const COUNTRIES: { code: string; name: string }[] = [
  { code: 'ke', name: 'Kenya' },
  { code: 'ng', name: 'Nigeria' },
  { code: 'gh', name: 'Ghana' },
  { code: 'za', name: 'South Africa' },
  { code: 'ug', name: 'Uganda' },
  { code: 'tz', name: 'Tanzania' },
  { code: 'et', name: 'Ethiopia' },
  { code: 'eg', name: 'Egypt' },
  { code: 'ma', name: 'Morocco' },
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'in', name: 'India' },
  { code: 'fr', name: 'France' },
  { code: 'de', name: 'Germany' },
  { code: 'es', name: 'Spain' },
  { code: 'br', name: 'Brazil' },
  { code: 'ru', name: 'Russia' },
  { code: 'cn', name: 'China' },
  { code: 'tr', name: 'Turkey' },
  { code: 'sa', name: 'Saudi Arabia' },
];

const CATEGORIES: { code: string; name: string }[] = [
  { code: 'news', name: 'News' },
  { code: 'sports', name: 'Sports' },
  { code: 'movies', name: 'Movies' },
  { code: 'entertainment', name: 'Entertainment' },
  { code: 'music', name: 'Music' },
  { code: 'kids', name: 'Kids' },
  { code: 'documentary', name: 'Documentary' },
  { code: 'cooking', name: 'Cooking' },
  { code: 'travel', name: 'Travel' },
  { code: 'science', name: 'Science' },
  { code: 'business', name: 'Business' },
  { code: 'religious', name: 'Religious' },
];

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? 'all';

  if (type === 'country') {
    const playlists: RepoPlaylist[] = COUNTRIES.map((c) => ({
      label: c.name,
      url: `${BASE}/index.country.${c.code}.m3u`,
      type: 'country',
      code: c.code,
    }));
    return NextResponse.json({ playlists });
  }

  if (type === 'category') {
    const playlists: RepoPlaylist[] = CATEGORIES.map((c) => ({
      label: c.name,
      url: `${BASE}/index.category.${c.code}.m3u`,
      type: 'category',
      code: c.code,
    }));
    return NextResponse.json({ playlists });
  }

  // all
  return NextResponse.json({
    playlists: [{ label: 'All Channels (8,000+)', url: `${BASE}/index.m3u`, type: 'all', code: 'all' }],
  });
}
