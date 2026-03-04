import { NextRequest, NextResponse } from 'next/server';
import {
  getAllSubscriptions,
  activateSubscription,
  getSubscription,
  lookupSubscriptions,
} from '@/lib/iptv-subscriptions';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false; // must set ADMIN_SECRET in env
  const auth = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret');
  return auth === secret;
}

/** GET /api/admin/iptv — list all subscriptions (optionally filter by q) */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q');
  const subs = q ? lookupSubscriptions(q) : getAllSubscriptions();
  return NextResponse.json({ subscriptions: subs });
}

/** POST /api/admin/iptv — activate a subscription manually */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subscriptionId, mpesaReceipt = 'MANUAL' } = await req.json();
  if (!subscriptionId) return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });

  const existing = getSubscription(subscriptionId);
  if (!existing) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

  if (existing.status === 'active') {
    return NextResponse.json({ subscription: existing, message: 'Already active' });
  }

  const activated = activateSubscription(subscriptionId, mpesaReceipt);
  return NextResponse.json({ subscription: activated });
}
