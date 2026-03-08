import { NextRequest, NextResponse } from 'next/server';
import {
  activateSubscription,
  getAllSubscriptions,
  getSubscription,
  searchSubscriptions,
  type IptvSubscription,
} from '@/lib/iptv-subscriptions';
import { provisionMemberFromSubscription } from '@/lib/movie-platform';
import { summarizeSubscriptions } from '@/lib/iptv-product';
import {
  ADMIN_SESSION_COOKIE,
  getAdminAuditTrail,
  getAdminById,
  getAdminContextByToken,
  isAdminConfigured,
  isSuperAdmin,
  listAdmins,
  recordAdminAudit,
} from '@/lib/admin-auth';

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

function getScopedSubscriptions(
  subscriptions: IptvSubscription[],
  adminId: string,
  canSeeAll: boolean
) {
  return canSeeAll
    ? subscriptions
    : subscriptions.filter((subscription) => subscription.assignedAdminId === adminId);
}

async function decorateSubscriptions(subscriptions: IptvSubscription[]) {
  return await Promise.all(
    subscriptions.map(async (subscription) => {
      const assignedAdmin = await getAdminById(subscription.assignedAdminId);
      const member =
        subscription.status === 'active'
          ? await (async () => {
              const profile = await provisionMemberFromSubscription(subscription);
              return {
                profileId: profile.profileId,
                accessCode: profile.accessCode,
              };
            })()
          : undefined;

      return {
        ...subscription,
        member,
        assignedAdmin: assignedAdmin
          ? {
              id: assignedAdmin.id,
              name: assignedAdmin.name,
              role: assignedAdmin.role,
              phone: assignedAdmin.phone,
            }
          : null,
      };
    })
  );
}

async function buildAdminHierarchy(
  subscriptions: IptvSubscription[],
  canSeeAll: boolean,
  currentAdminId: string
) {
  const admins = canSeeAll
    ? await listAdmins()
    : (await listAdmins()).filter((admin) => admin.id === currentAdminId);

  return await Promise.all(
    admins.map(async (admin) => {
      const owned = subscriptions.filter((subscription) => subscription.assignedAdminId === admin.id);
      return {
        admin,
        stats: summarizeSubscriptions(owned),
        subscriptions: await decorateSubscriptions(owned),
      };
    })
  );
}

export async function GET(req: NextRequest) {
  const auth = await getAuthorizedAdmin(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const canSeeAll = isSuperAdmin(auth.current.admin);
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const allSubscriptions = await getAllSubscriptions();
  const scopedSubscriptions = getScopedSubscriptions(
    allSubscriptions,
    auth.current.admin.id,
    canSeeAll
  );
  const visibleSubscriptions = q ? searchSubscriptions(q, scopedSubscriptions) : scopedSubscriptions;

  await recordAdminAudit({
    action: q ? 'subscription_search' : 'subscription_dashboard_view',
    status: 'success',
    actorId: auth.current.admin.id,
    actorLabel: auth.current.admin.name,
    summary: q
      ? `Searched ${canSeeAll ? 'all admins' : 'own'} onboarded users for "${q}".`
      : `Viewed ${canSeeAll ? 'the full admin hierarchy' : 'own onboarded users'}.`,
    target: q || auth.current.admin.id,
    ipAddress: getRequestIp(req),
    userAgent: req.headers.get('user-agent'),
  });

  const hierarchySource = q ? visibleSubscriptions : scopedSubscriptions;
  const hierarchy = await buildAdminHierarchy(
    hierarchySource,
    canSeeAll,
    auth.current.admin.id
  );

  return NextResponse.json({
    currentAdmin: auth.current.admin,
    subscriptions: await decorateSubscriptions(visibleSubscriptions),
    overview: summarizeSubscriptions(visibleSubscriptions),
    filteredCount: visibleSubscriptions.length,
    auditTrail: await getAdminAuditTrail(20),
    admins: hierarchy.map((node) => ({
      ...node.admin,
      subscriberCount: node.stats.totalSubscriptions,
      activeSubscriberCount: node.stats.activeSubscriptions,
      revenueKes: node.stats.totalRevenueKes,
    })),
    hierarchy,
  });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthorizedAdmin(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { subscriptionId, mpesaReceipt = 'MANUAL', assignedAdminId } = await req.json();
    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });
    }

    const existing = await getSubscription(subscriptionId);
    if (!existing) {
      await recordAdminAudit({
        action: 'subscription_activation',
        status: 'failed',
        actorId: auth.current.admin.id,
        actorLabel: auth.current.admin.name,
        summary: `Activation failed. Subscription ${subscriptionId} was not found.`,
        target: subscriptionId,
        ipAddress: getRequestIp(req),
        userAgent: req.headers.get('user-agent'),
      });

      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (!isSuperAdmin(auth.current.admin) && existing.assignedAdminId !== auth.current.admin.id) {
      return NextResponse.json({ error: 'You can only activate users assigned to you.' }, { status: 403 });
    }

    const nextAssignedAdminId = isSuperAdmin(auth.current.admin)
      ? assignedAdminId || existing.assignedAdminId
      : auth.current.admin.id;

    if (!(await getAdminById(nextAssignedAdminId))) {
      return NextResponse.json({ error: 'Assigned admin was not found.' }, { status: 400 });
    }

    if (existing.status === 'active') {
      await recordAdminAudit({
        action: 'subscription_activation',
        status: 'success',
        actorId: auth.current.admin.id,
        actorLabel: auth.current.admin.name,
        summary: `Checked subscription ${subscriptionId}; it was already active.`,
        target: subscriptionId,
        ipAddress: getRequestIp(req),
        userAgent: req.headers.get('user-agent'),
      });

      return NextResponse.json({ subscription: existing, message: 'Already active' });
    }

    const activated = await activateSubscription(subscriptionId, mpesaReceipt, {
      assignedAdminId: nextAssignedAdminId,
      assignedByAdminId: auth.current.admin.id,
    });
    if (activated) {
      await provisionMemberFromSubscription(activated);
    }

    await recordAdminAudit({
      action: 'subscription_activation',
      status: 'success',
      actorId: auth.current.admin.id,
      actorLabel: auth.current.admin.name,
      summary: `Activated subscription ${subscriptionId} under ${nextAssignedAdminId}.`,
      target: subscriptionId,
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      subscription: activated,
      auditTrail: await getAdminAuditTrail(20),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Activation failed';

    await recordAdminAudit({
      action: 'subscription_activation',
      status: 'failed',
      actorId: auth.current.admin.id,
      actorLabel: auth.current.admin.name,
      summary: `Activation failed. ${message}`,
      target: null,
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
