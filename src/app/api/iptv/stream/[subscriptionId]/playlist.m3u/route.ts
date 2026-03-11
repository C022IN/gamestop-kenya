import { NextRequest, NextResponse } from 'next/server';
import { formatPlaylist, getPlaylistEntries } from '@/lib/iptv-catalog';
import { getSubscription } from '@/lib/iptv-subscriptions';

interface PlaylistRouteProps {
  params: Promise<{ subscriptionId: string }>;
}

export async function GET(req: NextRequest, { params }: PlaylistRouteProps) {
  const { subscriptionId } = await params;
  const username = req.nextUrl.searchParams.get('username')?.trim();
  const password = req.nextUrl.searchParams.get('password')?.trim();

  if (!username || !password) {
    return NextResponse.json(
      { error: 'username and password are required' },
      { status: 401 }
    );
  }

  const subscription = await getSubscription(subscriptionId);
  if (!subscription || subscription.status !== 'active') {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  if (
    subscription.credentials?.xtreamUsername !== username ||
    subscription.credentials?.xtreamPassword !== password
  ) {
    return NextResponse.json({ error: 'Invalid playlist credentials' }, { status: 401 });
  }

  if (new Date(subscription.expiresAt).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Subscription has expired' }, { status: 403 });
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
