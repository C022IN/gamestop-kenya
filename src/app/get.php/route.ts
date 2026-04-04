import { NextRequest, NextResponse } from 'next/server';
import { formatPlaylist, getPlaylistEntries } from '@/lib/iptv-catalog';
import {
  getSubscriptionByCredentials,
  hasSubscriptionPlaybackAccess,
} from '@/lib/iptv-subscriptions';

export const dynamic = 'force-dynamic';

function plainTextResponse(status: number, message: string) {
  return new NextResponse(message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')?.trim() ?? '';
  const password = req.nextUrl.searchParams.get('password')?.trim() ?? '';

  if (!username || !password) {
    return plainTextResponse(401, 'username and password are required');
  }

  const subscription = await getSubscriptionByCredentials(username, password, { fresh: true });
  if (!subscription) {
    return plainTextResponse(404, 'Subscription not found');
  }

  if (!hasSubscriptionPlaybackAccess(subscription)) {
    return plainTextResponse(403, 'Subscription has expired');
  }

  const playlist = formatPlaylist(await getPlaylistEntries());

  return new NextResponse(playlist, {
    headers: {
      'Content-Type': 'audio/x-mpegurl; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `inline; filename="${subscription.id}.m3u"`,
    },
  });
}
