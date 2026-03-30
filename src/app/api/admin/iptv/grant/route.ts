import { NextRequest, NextResponse } from 'next/server';
import { activateSubscription, createPendingSubscription, IPTV_PLANS, type PlanId } from '@/lib/iptv-subscriptions';
import { provisionMemberFromSubscription } from '@/lib/movie-platform';
import { normaliseMpesaPhone } from '@/lib/mpesa';
import {
  recordAdminRequestAudit,
  requireSuperAdminRequest,
} from '@/domains/admin/api/request-context';

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
    customerName: string;
    planId: PlanId;
    mpesaReceipt?: string;
  };

  if (!rawPhone || !customerName || !planId) {
    return NextResponse.json({ error: 'phone, customerName and planId are required.' }, { status: 400 });
  }

  if (!IPTV_PLANS[planId]) {
    return NextResponse.json({ error: `Unknown plan: ${planId}` }, { status: 400 });
  }

  const phone = normaliseMpesaPhone(rawPhone);
  const receipt = mpesaReceipt?.trim() || `ADMIN-GRANT-${Date.now()}`;
  const checkoutRequestId = `ADMIN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  try {
    const pending = await createPendingSubscription({
      planId,
      customerName: customerName.trim(),
      email: `${phone}@admin.grant`,
      phone,
      checkoutRequestId,
      assignedAdminId: auth.context.current.admin.id,
      assignedByAdminId: auth.context.current.admin.id,
    });

    const activated = await activateSubscription(pending.id, receipt, {
      assignedAdminId: auth.context.current.admin.id,
      assignedByAdminId: auth.context.current.admin.id,
    });

    if (!activated) {
      return NextResponse.json({ error: 'Activation failed.' }, { status: 500 });
    }

    const member = await provisionMemberFromSubscription(activated);

    await recordAdminRequestAudit(auth.context, {
      action: 'subscription_grant',
      status: 'success',
      summary: `Granted ${planId} access to ${phone} (${customerName}). Receipt: ${receipt}.`,
      target: activated.id,
    });

    return NextResponse.json({
      subscription: activated,
      member: {
        profileId: member.profileId,
        accessCode: member.accessCode,
        phone,
      },
    });
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
