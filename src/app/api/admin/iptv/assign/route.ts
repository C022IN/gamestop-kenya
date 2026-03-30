import { NextRequest, NextResponse } from 'next/server';
import { getAdminById } from '@/lib/admin-auth';
import { assignSubscriptionToAdmin, getSubscription } from '@/lib/iptv-subscriptions';
import {
  recordAdminRequestAudit,
  requireSuperAdminRequest,
} from '@/domains/admin/api/request-context';

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdminRequest(req, {
    forbiddenMessage: 'Only the super admin can reassign users.',
  });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { subscriptionId, adminId } = await req.json();
    if (!subscriptionId || !adminId) {
      return NextResponse.json({ error: 'subscriptionId and adminId are required' }, { status: 400 });
    }

    if (!(await getSubscription(subscriptionId))) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const targetAdmin = await getAdminById(adminId);
    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const updated = await assignSubscriptionToAdmin(
      subscriptionId,
      adminId,
      auth.context.current.admin.id
    );

    await recordAdminRequestAudit(auth.context, {
      action: 'subscription_reassign',
      status: 'success',
      summary: `Assigned ${subscriptionId} to ${targetAdmin.name}.`,
      target: subscriptionId,
    });

    return NextResponse.json({ subscription: updated, assignedAdmin: targetAdmin });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not reassign user' },
      { status: 500 }
    );
  }
}
