import { NextRequest, NextResponse } from 'next/server';
import {
  recordAdminRequestAudit,
  requireAdminRequest,
} from '@/domains/admin/api/request-context';
import { reprovisionIptvSubscription } from '@/domains/iptv/services/subscription-management';
import { isSuperAdmin } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req, {
    notConfiguredMessage: 'Admin login is not configured yet.',
  });
  if (!auth.ok) {
    return auth.response;
  }

  let subscriptionId: string | null = null;

  try {
    const body = await req.json();
    subscriptionId = typeof body.subscriptionId === 'string' ? body.subscriptionId.trim() : '';

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required.' }, { status: 400 });
    }

    const result = await reprovisionIptvSubscription({
      subscriptionId,
      actingAdminId: auth.context.current.admin.id,
      isSuperAdmin: isSuperAdmin(auth.context.current.admin),
    });

    if (!result.ok) {
      await recordAdminRequestAudit(auth.context, {
        action: 'subscription_reprovision',
        status: 'failed',
        summary: `Credential reprovision failed. ${result.error}`,
        target: subscriptionId,
      });
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await recordAdminRequestAudit(auth.context, {
      action: 'subscription_reprovision',
      status: 'success',
      summary: `Reprovisioned IPTV credentials for ${subscriptionId}.`,
      target: subscriptionId,
    });

    return NextResponse.json({
      subscription: result.data.subscription,
      message: 'Credentials reprovisioned.',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not reprovision IPTV credentials.';

    await recordAdminRequestAudit(auth.context, {
      action: 'subscription_reprovision',
      status: 'failed',
      summary: `Credential reprovision failed. ${message}`,
      target: subscriptionId,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
