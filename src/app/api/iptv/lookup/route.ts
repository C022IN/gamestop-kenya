import { NextRequest, NextResponse } from 'next/server';
import { getSubscription, getAllSubscriptions, searchSubscriptions } from '@/lib/iptv-subscriptions';
import {
  ADMIN_SESSION_COOKIE,
  getAdminContextByToken,
  isAdminConfigured,
  isSuperAdmin,
  recordAdminAudit,
} from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

function getRequestIp(req: NextRequest): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

async function getAuthorizedAdmin(req: NextRequest) {
  if (!(await isAdminConfigured())) {
    return { error: 'Admin login is not configured yet.', status: 503 as const };
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

export async function GET(req: NextRequest) {
  const auth = await getAuthorizedAdmin(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q')?.trim();
  const id = searchParams.get('id');
  const canSeeAll = isSuperAdmin(auth.current.admin);
  const allSubscriptions = await getAllSubscriptions();
  const scopedSubscriptions = canSeeAll
    ? allSubscriptions
    : allSubscriptions.filter((subscription) => subscription.assignedAdminId === auth.current.admin.id);

  if (id) {
    const sub = await getSubscription(id);
    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    if (!canSeeAll && sub.assignedAdminId !== auth.current.admin.id) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    await recordAdminAudit({
      action: 'subscription_lookup',
      status: 'success',
      actorId: auth.current.admin.id,
      actorLabel: auth.current.admin.name,
      summary: `Looked up subscription ${id}.`,
      target: id,
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({ subscriptions: [sub] });
  }

  if (!q || q.length < 3) {
    return NextResponse.json({ error: 'Provide a phone, email, receipt, or ID (at least 3 chars)' }, { status: 400 });
  }

  const results = searchSubscriptions(q, scopedSubscriptions);

  await recordAdminAudit({
    action: 'subscription_lookup',
    status: 'success',
    actorId: auth.current.admin.id,
    actorLabel: auth.current.admin.name,
    summary: `Looked up users for "${q}".`,
    target: q,
    ipAddress: getRequestIp(req),
    userAgent: req.headers.get('user-agent'),
  });

  return NextResponse.json({ subscriptions: results });
}
