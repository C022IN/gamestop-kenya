import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  getAdminById,
  getAdminContextByToken,
  isAdminConfigured,
  isSuperAdmin,
  recordAdminAudit,
} from '@/lib/admin-auth';
import { assignSubscriptionToAdmin, getSubscription } from '@/lib/iptv-subscriptions';

function getRequestIp(req: NextRequest): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

async function getAuthorizedAdmin(req: NextRequest) {
  if (!isAdminConfigured()) {
    return { error: 'Super-admin login is not configured yet.', status: 503 as const };
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return { error: 'Unauthorized', status: 401 as const };
  }

  const current = await getAdminContextByToken(token);
  if (!current) {
    return { error: 'Unauthorized', status: 401 as const };
  }

  return { current };
}

export async function POST(req: NextRequest) {
  const auth = await getAuthorizedAdmin(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isSuperAdmin(auth.current.admin)) {
    return NextResponse.json({ error: 'Only the super admin can reassign users.' }, { status: 403 });
  }

  try {
    const { subscriptionId, adminId } = await req.json();
    if (!subscriptionId || !adminId) {
      return NextResponse.json({ error: 'subscriptionId and adminId are required' }, { status: 400 });
    }

    const subscription = await getSubscription(subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const targetAdmin = await getAdminById(adminId);
    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const updated = await assignSubscriptionToAdmin(subscriptionId, adminId, auth.current.admin.id);

    await recordAdminAudit({
      action: 'subscription_reassign',
      status: 'success',
      actorId: auth.current.admin.id,
      actorLabel: auth.current.admin.name,
      summary: `Assigned ${subscriptionId} to ${targetAdmin.name}.`,
      target: subscriptionId,
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({ subscription: updated, assignedAdmin: targetAdmin });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not reassign user' },
      { status: 500 }
    );
  }
}
