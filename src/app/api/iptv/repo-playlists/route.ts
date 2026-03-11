import { NextResponse } from 'next/server';

export interface RepoPlaylist {
  label: string;
  url: string;
  type: 'managed';
  code: string;
}

function parseConfiguredPlaylists(): RepoPlaylist[] {
  const raw = process.env.IPTV_PROVIDER_PLAYLISTS_JSON?.trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Array<{
      label?: string;
      url?: string;
      code?: string;
    }>;

    return parsed
      .filter((entry) => entry.label && entry.url)
      .map((entry, index) => ({
        label: entry.label as string,
        url: entry.url as string,
        type: 'managed' as const,
        code: entry.code?.trim() || `managed-${index + 1}`,
      }));
  } catch {
    return [];
  }
}

export async function GET() {
  const playlists = parseConfiguredPlaylists();

  return NextResponse.json({
    playlists,
    message:
      playlists.length > 0
        ? null
        : 'No managed provider playlists are configured. Use IPTV_PROVIDER_PLAYLISTS_JSON or webhook provisioning.',
  });
}
