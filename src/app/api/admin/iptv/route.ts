import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin, getAdminAuditTrail } from '@/lib/admin-auth';
import {
  recordAdminRequestAudit,
  requireAdminRequest,
} from '@/domains/admin/api/request-context';
import { getIptvDashboard } from '@/domains/admin/services/iptv-dashboard-service';
import {
  activateIptvSubscription,
} from '@/domains/iptv/services/subscription-management';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  const canSeeAll = isSuperAdmin(auth.context.current.admin);
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';

  const dashboard = await getIptvDashboard(auth.context, q);

  await recordAdminRequestAudit(auth.context, {
    action: q ? 'subscription_search' : 'subscription_dashboard_view',
    status: 'success',
    summary: q
      ? `Searched ${canSeeAll ? 'all admins' : 'own'} onboarded users for "${q}".`
      : `Viewed ${canSeeAll ? 'the full admin hierarchy' : 'own onboarded users'}.`,
    target: q || auth.context.current.admin.id,
  });

  return NextResponse.json({
    ...dashboard,
    auditTrail: await getAdminAuditTrail(20),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { subscriptionId, mpesaReceipt = 'MANUAL', assignedAdminId } = await req.json();
    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });
    }

    const result = await activateIptvSubscription({
      subscriptionId,
      mpesaReceipt,
      assignedAdminId,
      actingAdminId: auth.context.current.admin.id,
      isSuperAdmin: isSuperAdmin(auth.context.current.admin),
    });

    if (!result.ok) {
      await recordAdminRequestAudit(auth.context, {
        action: 'subscription_activation',
        status: 'failed',
        summary: `Activation failed. ${result.error}`,
        target: subscriptionId,
      });
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { subscription, alreadyActive } = result.data;

    await recordAdminRequestAudit(auth.context, {
      action: 'subscription_activation',
      status: 'success',
      summary: alreadyActive
        ? `Checked subscription ${subscriptionId}; it was already active.`
        : `Activated subscription ${subscriptionId} under ${assignedAdminId ?? auth.context.current.admin.id}.`,
      target: subscriptionId,
    });

    if (alreadyActive) {
      return NextResponse.json({ subscription, message: 'Already active' });
    }

    return NextResponse.json({
      subscription,
      auditTrail: await getAdminAuditTrail(20),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Activation failed';

    await recordAdminRequestAudit(auth.context, {
      action: 'subscription_activation',
      status: 'failed',
      summary: `Activation failed. ${message}`,
      target: null,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
