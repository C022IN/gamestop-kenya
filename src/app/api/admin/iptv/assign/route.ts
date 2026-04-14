import { NextRequest, NextResponse } from 'next/server';
import {
  recordAdminRequestAudit,
  requireSuperAdminRequest,
} from '@/domains/admin/api/request-context';
import { assignIptvSubscription } from '@/domains/iptv/services/subscription-management';

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

    const result = await assignIptvSubscription({
      subscriptionId,
      targetAdminId: adminId,
      actingAdminId: auth.context.current.admin.id,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { subscription, assignedAdmin } = result.data;

    await recordAdminRequestAudit(auth.context, {
      action: 'subscription_reassign',
      status: 'success',
      summary: `Assigned ${subscriptionId} to ${assignedAdmin?.name ?? adminId}.`,
      target: subscriptionId,
    });

    return NextResponse.json({ subscription, assignedAdmin });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not reassign user' },
      { status: 500 }
    );
  }
}
