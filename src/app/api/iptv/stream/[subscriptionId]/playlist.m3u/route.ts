import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionPlaylist } from '@/domains/iptv/services/playlist-service';

export const dynamic = 'force-dynamic';

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

  const result = await getSubscriptionPlaylist({ subscriptionId, username, password });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return new NextResponse(result.data.content, {
    headers: {
      'Content-Type': 'audio/x-mpegurl; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `inline; filename="${subscriptionId}.m3u"`,
    },
  });
}
