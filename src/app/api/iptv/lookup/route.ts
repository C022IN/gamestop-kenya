import { NextRequest, NextResponse } from 'next/server';
import { lookupSubscriptions, getSubscription } from '@/lib/iptv-subscriptions';

/** GET /api/iptv/lookup?q=email_or_phone  OR  ?id=subscriptionId */
export async function GET(req: NextRequest) {
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
