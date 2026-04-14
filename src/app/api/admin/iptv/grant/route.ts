import { NextRequest, NextResponse } from 'next/server';
import {
  recordAdminRequestAudit,
  requireSuperAdminRequest,
} from '@/domains/admin/api/request-context';
import {
  grantIptvSubscription,
  type PlanId,
} from '@/domains/iptv/services/subscription-management';

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdminRequest(req, {
    notConfiguredMessage: 'Not configured',
    forbiddenMessage: 'Super admin only.',
  });
  if (!auth.ok) {
    return auth.response;
  }

  const body = await req.json();
  const { phone: rawPhone, customerName, planId, mpesaReceipt } = body as {
    phone: string;
    customerName?: string;
    planId: PlanId;
    mpesaReceipt?: string;
  };

  if (!rawPhone || !planId) {
    return NextResponse.json({ error: 'phone and planId are required.' }, { status: 400 });
  }

  try {
    const result = await grantIptvSubscription({
      phone: rawPhone,
      customerName,
      planId,
      mpesaReceipt,
      actingAdminId: auth.context.current.admin.id,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { subscription, member, reusedExistingMember } = result.data;

    await recordAdminRequestAudit(auth.context, {
      action: 'subscription_grant',
      status: 'success',
      summary: reusedExistingMember
        ? `Renewed ${member.phone} on ${planId} without re-registering. Receipt: ${mpesaReceipt ?? 'auto'}.`
        : `Granted ${planId} access to ${member.phone} (${member.profileId}). Receipt: ${mpesaReceipt ?? 'auto'}.`,
      target: subscription.id,
    });

    return NextResponse.json({ subscription, member, reusedExistingMember });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Grant failed.';
    await recordAdminRequestAudit(auth.context, {
      action: 'subscription_grant',
      status: 'failed',
      summary: message,
      target: rawPhone,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
