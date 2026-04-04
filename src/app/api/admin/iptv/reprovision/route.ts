import { NextRequest, NextResponse } from 'next/server';
import {
  getSubscription,
  hasSubscriptionPlaybackAccess,
  reprovisionSubscriptionCredentials,
} from '@/lib/iptv-subscriptions';
import {
  recordAdminRequestAudit,
  requireAdminRequest,
} from '@/domains/admin/api/request-context';

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

    const existing = await getSubscription(subscriptionId, { fresh: true });
    if (!existing) {
      await recordAdminRequestAudit(auth.context, {
        action: 'subscription_reprovision',
        status: 'failed',
        summary: `Credential reprovision failed. Subscription ${subscriptionId} was not found.`,
        target: subscriptionId,
      });

      return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
    }

    const canManage =
      auth.context.current.admin.role === 'super_admin' ||
      existing.assignedAdminId === auth.context.current.admin.id;

    if (!canManage) {
      return NextResponse.json(
        { error: 'You can only reprovision users assigned to you.' },
        { status: 403 }
      );
    }

    if (!hasSubscriptionPlaybackAccess(existing)) {
      return NextResponse.json(
        { error: 'Only active subscriptions can be reprovisioned.' },
        { status: 400 }
      );
    }

    const updated = await reprovisionSubscriptionCredentials(subscriptionId);
    if (!updated) {
      throw new Error('Subscription could not be reprovisioned.');
    }

    await recordAdminRequestAudit(auth.context, {
      action: 'subscription_reprovision',
      status: 'success',
      summary: `Reprovisioned IPTV credentials for ${subscriptionId}.`,
      target: subscriptionId,
    });

    return NextResponse.json({
      subscription: updated,
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
