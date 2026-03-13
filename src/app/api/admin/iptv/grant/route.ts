import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  getAdminContextByToken,
  isAdminConfigured,
  isSuperAdmin,
  recordAdminAudit,
} from '@/lib/admin-auth';
import { createPendingSubscription, activateSubscription } from '@/lib/iptv-subscriptions';
import { provisionMemberFromSubscription } from '@/lib/movie-platform';
import { normaliseMpesaPhone } from '@/lib/mpesa';
import { IPTV_PLANS, type PlanId } from '@/lib/iptv-subscriptions';

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

async function getAuthorizedAdmin(req: NextRequest) {
  if (!(await isAdminConfigured())) return { error: 'Not configured', status: 503 as const };
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return { error: 'Unauthorized', status: 401 as const };
  const current = await getAdminContextByToken(token);
  if (!current) return { error: 'Unauthorized', status: 401 as const };
  return { current };
}

/**
 * POST /api/admin/iptv/grant
 * Body: { phone, customerName, planId, mpesaReceipt? }
 *
 * Creates an immediately-activated subscription for any phone number
 * without requiring an M-Pesa payment. Super-admin only.
 */
export async function POST(req: NextRequest) {
  const auth = await getAuthorizedAdmin(req);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!isSuperAdmin(auth.current.admin)) {
    return NextResponse.json({ error: 'Super admin only.' }, { status: 403 });
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
      assignedAdminId: auth.current.admin.id,
      assignedByAdminId: auth.current.admin.id,
    });

    const activated = await activateSubscription(pending.id, receipt, {
      assignedAdminId: auth.current.admin.id,
      assignedByAdminId: auth.current.admin.id,
    });

    if (!activated) {
      return NextResponse.json({ error: 'Activation failed.' }, { status: 500 });
    }

    const member = await provisionMemberFromSubscription(activated);

    await recordAdminAudit({
      action: 'subscription_grant',
      status: 'success',
      actorId: auth.current.admin.id,
      actorLabel: auth.current.admin.name,
      summary: `Granted ${planId} access to ${phone} (${customerName}). Receipt: ${receipt}.`,
      target: activated.id,
      ipAddress: getIp(req),
      userAgent: req.headers.get('user-agent'),
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
    await recordAdminAudit({
      action: 'subscription_grant',
      status: 'failed',
      actorId: auth.current.admin.id,
      actorLabel: auth.current.admin.name,
      summary: message,
      target: rawPhone,
      ipAddress: getIp(req),
      userAgent: req.headers.get('user-agent'),
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
