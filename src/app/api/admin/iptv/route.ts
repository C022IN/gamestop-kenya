import { NextRequest, NextResponse } from 'next/server';
import {
  activateSubscription,
  getAllSubscriptions,
  getSubscription,
  type IptvSubscription,
} from '@/lib/iptv-subscriptions';
import { provisionMemberFromSubscription } from '@/lib/movie-platform';
import { summarizeSubscriptions } from '@/lib/iptv-product';
import {
  getAdminAuditTrail,
  getAdminById,
  isSuperAdmin,
  listAdmins,
} from '@/lib/admin-auth';
import {
  recordAdminRequestAudit,
  requireAdminRequest,
} from '@/domains/admin/api/request-context';
import {
  buildSubscriptionBundles,
  matchesSubscriptionBundle,
} from '@/domains/admin/services/subscription-bundles';

export const dynamic = 'force-dynamic';

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
      const bundles = buildSubscriptionBundles(await decorateSubscriptions(owned));
      const summary = summarizeSubscriptions(owned);
      return {
        admin,
        stats: {
          ...summary,
          customerCount: bundles.length,
          activeCustomerCount: bundles.filter((bundle) => bundle.status === 'active').length,
          pendingCustomerCount: bundles.filter((bundle) => bundle.status === 'pending').length,
          expiredCustomerCount: bundles.filter((bundle) => bundle.status === 'expired').length,
        },
        bundles,
      };
    })
  );
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  const canSeeAll = isSuperAdmin(auth.context.current.admin);
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const allSubscriptions = await getAllSubscriptions();
  const scopedSubscriptions = getScopedSubscriptions(
    allSubscriptions,
    auth.context.current.admin.id,
    canSeeAll
  );
  const decoratedScopedSubscriptions = await decorateSubscriptions(scopedSubscriptions);
  const scopedBundles = buildSubscriptionBundles(decoratedScopedSubscriptions);
  const visibleBundles = q
    ? scopedBundles.filter((bundle) => matchesSubscriptionBundle(bundle, q))
    : scopedBundles;
  const visibleSubscriptions = visibleBundles.flatMap((bundle) => bundle.subscriptions);
  const overview = summarizeSubscriptions(visibleSubscriptions);

  await recordAdminRequestAudit(auth.context, {
    action: q ? 'subscription_search' : 'subscription_dashboard_view',
    status: 'success',
    summary: q
      ? `Searched ${canSeeAll ? 'all admins' : 'own'} onboarded users for "${q}".`
      : `Viewed ${canSeeAll ? 'the full admin hierarchy' : 'own onboarded users'}.`,
    target: q || auth.context.current.admin.id,
  });

  const hierarchySource = q ? visibleSubscriptions : scopedSubscriptions;
  const hierarchy = await buildAdminHierarchy(
    hierarchySource,
    canSeeAll,
    auth.context.current.admin.id
  );

  return NextResponse.json({
    currentAdmin: auth.context.current.admin,
    bundles: visibleBundles,
    overview: {
      ...overview,
      customerCount: visibleBundles.length,
      activeCustomerCount: visibleBundles.filter((bundle) => bundle.status === 'active').length,
      pendingCustomerCount: visibleBundles.filter((bundle) => bundle.status === 'pending').length,
      expiredCustomerCount: visibleBundles.filter((bundle) => bundle.status === 'expired').length,
    },
    filteredCount: visibleBundles.length,
    auditTrail: await getAdminAuditTrail(20),
    admins: hierarchy.map((node) => ({
      ...node.admin,
      subscriberCount: node.stats.customerCount,
      activeSubscriberCount: node.stats.activeCustomerCount,
      revenueKes: node.stats.totalRevenueKes,
    })),
    hierarchy,
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

    const existing = await getSubscription(subscriptionId);
    if (!existing) {
      await recordAdminRequestAudit(auth.context, {
        action: 'subscription_activation',
        status: 'failed',
        summary: `Activation failed. Subscription ${subscriptionId} was not found.`,
        target: subscriptionId,
      });

      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (
      !isSuperAdmin(auth.context.current.admin) &&
      existing.assignedAdminId !== auth.context.current.admin.id
    ) {
      return NextResponse.json({ error: 'You can only activate users assigned to you.' }, { status: 403 });
    }

    const nextAssignedAdminId = isSuperAdmin(auth.context.current.admin)
      ? assignedAdminId || existing.assignedAdminId
      : auth.context.current.admin.id;

    if (!(await getAdminById(nextAssignedAdminId))) {
      return NextResponse.json({ error: 'Assigned admin was not found.' }, { status: 400 });
    }

    if (existing.status === 'active') {
      await recordAdminRequestAudit(auth.context, {
        action: 'subscription_activation',
        status: 'success',
        summary: `Checked subscription ${subscriptionId}; it was already active.`,
        target: subscriptionId,
      });

      return NextResponse.json({ subscription: existing, message: 'Already active' });
    }

    const activated = await activateSubscription(subscriptionId, mpesaReceipt, {
      assignedAdminId: nextAssignedAdminId,
      assignedByAdminId: auth.context.current.admin.id,
    });
    if (activated) {
      await provisionMemberFromSubscription(activated);
    }

    await recordAdminRequestAudit(auth.context, {
      action: 'subscription_activation',
      status: 'success',
      summary: `Activated subscription ${subscriptionId} under ${nextAssignedAdminId}.`,
      target: subscriptionId,
    });

    return NextResponse.json({
      subscription: activated,
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
