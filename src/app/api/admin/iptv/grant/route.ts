import { NextRequest, NextResponse } from 'next/server';
import {
  activateSubscription,
  createPendingSubscription,
  getLatestSubscriptionForPhone,
  IPTV_PLANS,
  type PlanId,
} from '@/lib/iptv-subscriptions';
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
    customerName?: string;
    planId: PlanId;
    mpesaReceipt?: string;
  };

  if (!rawPhone || !planId) {
    return NextResponse.json({ error: 'phone and planId are required.' }, { status: 400 });
  }

  if (!IPTV_PLANS[planId]) {
    return NextResponse.json({ error: `Unknown plan: ${planId}` }, { status: 400 });
  }

  const phone = normaliseMpesaPhone(rawPhone);
  const existing = await getLatestSubscriptionForPhone(phone);
  const resolvedCustomerName = customerName?.trim() || existing?.customerName?.trim() || '';
  if (!resolvedCustomerName) {
    return NextResponse.json(
      { error: 'customerName is required for a new user. Existing users can be renewed by phone only.' },
      { status: 400 }
    );
  }

  const receipt = mpesaReceipt?.trim() || `ADMIN-GRANT-${Date.now()}`;
  const checkoutRequestId = `ADMIN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const assignedAdminId = existing?.assignedAdminId ?? auth.context.current.admin.id;
  const resolvedEmail = existing?.email?.trim() || `${phone}@admin.grant`;
  const isRenewal = Boolean(existing);

  try {
    const pending = await createPendingSubscription({
      planId,
      customerName: resolvedCustomerName,
      email: resolvedEmail,
      phone,
      checkoutRequestId,
      assignedAdminId,
      assignedByAdminId: auth.context.current.admin.id,
    });

    const activated = await activateSubscription(pending.id, receipt, {
      assignedAdminId,
      assignedByAdminId: auth.context.current.admin.id,
    });

    if (!activated) {
      return NextResponse.json({ error: 'Activation failed.' }, { status: 500 });
    }

    const member = await provisionMemberFromSubscription(activated);

    await recordAdminRequestAudit(auth.context, {
      action: 'subscription_grant',
      status: 'success',
      summary: isRenewal
        ? `Renewed ${phone} on ${planId} without re-registering. Receipt: ${receipt}.`
        : `Granted ${planId} access to ${phone} (${resolvedCustomerName}). Receipt: ${receipt}.`,
      target: activated.id,
    });

    return NextResponse.json({
      subscription: activated,
      member: {
        profileId: member.profileId,
        accessCode: member.accessCode,
        phone,
      },
      reusedExistingMember: isRenewal,
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
