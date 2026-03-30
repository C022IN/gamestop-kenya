import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/admin-auth';
import { getAllSubscriptions, getSubscription, searchSubscriptions } from '@/lib/iptv-subscriptions';
import {
  recordAdminRequestAudit,
  requireAdminRequest,
} from '@/domains/admin/api/request-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q')?.trim();
  const id = searchParams.get('id');
  const canSeeAll = isSuperAdmin(auth.context.current.admin);
  const allSubscriptions = await getAllSubscriptions();
  const scopedSubscriptions = canSeeAll
    ? allSubscriptions
    : allSubscriptions.filter(
        (subscription) => subscription.assignedAdminId === auth.context.current.admin.id
      );

  if (id) {
    const sub = await getSubscription(id);
    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    if (!canSeeAll && sub.assignedAdminId !== auth.context.current.admin.id) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    await recordAdminRequestAudit(auth.context, {
      action: 'subscription_lookup',
      status: 'success',
      summary: `Looked up subscription ${id}.`,
      target: id,
    });

    return NextResponse.json({ subscriptions: [sub] });
  }

  if (!q || q.length < 3) {
    return NextResponse.json(
      { error: 'Provide a phone, email, receipt, or ID (at least 3 chars)' },
      { status: 400 }
    );
  }

  const results = searchSubscriptions(q, scopedSubscriptions);

  await recordAdminRequestAudit(auth.context, {
    action: 'subscription_lookup',
    status: 'success',
    summary: `Looked up users for "${q}".`,
    target: q,
  });

  return NextResponse.json({ subscriptions: results });
}
