import { NextRequest, NextResponse } from 'next/server';
import { lookupSubscriptions, getSubscription } from '@/lib/iptv-subscriptions';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret');
  return auth === secret;
}

/** Admin-only lookup by email, phone, or subscription ID */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q');
  const id = searchParams.get('id');

  if (id) {
    const sub = getSubscription(id);
    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    return NextResponse.json({ subscriptions: [sub] });
  }

  if (!q || q.trim().length < 3) {
    return NextResponse.json({ error: 'Provide an email or phone number (at least 3 chars)' }, { status: 400 });
  }

  const results = lookupSubscriptions(q.trim());
  return NextResponse.json({ subscriptions: results });
}
