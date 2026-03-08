import { NextRequest, NextResponse } from 'next/server';
import {
  getAllSubscriptions,
  activateSubscription,
  getSubscription,
  lookupSubscriptions,
} from '@/lib/iptv-subscriptions';
import { provisionMemberFromSubscription } from '@/lib/movie-platform';
import { summarizeSubscriptions } from '@/lib/iptv-product';

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
  const allSubscriptions = getAllSubscriptions();
  const subscriptions = (q ? lookupSubscriptions(q) : allSubscriptions).map((subscription) => {
    if (subscription.status !== 'active') return subscription;
    const member = provisionMemberFromSubscription(subscription);
    return {
      ...subscription,
      member: {
        profileId: member.profileId,
        accessCode: member.accessCode,
      },
    };
  });

  return NextResponse.json({
    subscriptions,
    overview: summarizeSubscriptions(allSubscriptions),
    filteredCount: subscriptions.length,
  });
}

/** POST /api/admin/iptv — activate a subscription manually */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { subscriptionId, mpesaReceipt = 'MANUAL' } = await req.json();
    if (!subscriptionId) return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });

    const existing = getSubscription(subscriptionId);
    if (!existing) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

    if (existing.status === 'active') {
      return NextResponse.json({ subscription: existing, message: 'Already active' });
    }

    const activated = await activateSubscription(subscriptionId, mpesaReceipt);
    if (activated) {
      provisionMemberFromSubscription(activated);
    }

    return NextResponse.json({ subscription: activated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Activation failed' },
      { status: 500 }
    );
  }
}
