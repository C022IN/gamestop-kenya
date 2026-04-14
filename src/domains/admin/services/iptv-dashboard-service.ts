import { getAdminById, isSuperAdmin, listAdmins } from '@/lib/admin-auth';
import { getAllSubscriptions, type IptvSubscription } from '@/lib/iptv-subscriptions';
import { summarizeSubscriptions } from '@/lib/iptv-product';
import { provisionMemberFromSubscription } from '@/lib/movie-platform';
import {
  buildSubscriptionBundles,
  matchesSubscriptionBundle,
  type BundleableSubscription,
} from '@/domains/admin/services/subscription-bundles';
import type { AdminRequestContext } from '@/domains/admin/api/request-context';

export type DecoratedSubscription = IptvSubscription & {
  playlistUrl: string | null;
  member?: { profileId: string; accessCode: string };
  assignedAdmin: {
    id: string;
    name: string;
    role: 'super_admin' | 'admin';
    phone: string | null;
  } | null;
};

export function getScopedSubscriptions(
  subscriptions: IptvSubscription[],
  adminId: string,
  canSeeAll: boolean
): IptvSubscription[] {
  return canSeeAll
    ? subscriptions
    : subscriptions.filter((s) => s.assignedAdminId === adminId);
}

export async function decorateSubscriptions(
  subscriptions: IptvSubscription[]
): Promise<DecoratedSubscription[]> {
  return Promise.all(
    subscriptions.map(async (subscription) => {
      const assignedAdmin = await getAdminById(subscription.assignedAdminId);
      const member =
        subscription.status === 'active'
          ? await provisionMemberFromSubscription(subscription).then((p) => ({
              profileId: p.profileId,
              accessCode: p.accessCode,
            }))
          : undefined;

      return {
        ...subscription,
        playlistUrl: subscription.credentials?.m3uUrl ?? null,
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
    : (await listAdmins()).filter((a) => a.id === currentAdminId);

  return Promise.all(
    admins.map(async (admin) => {
      const owned = subscriptions.filter((s) => s.assignedAdminId === admin.id);
      const bundles = buildSubscriptionBundles(
        (await decorateSubscriptions(owned)) as BundleableSubscription[]
      );
      const summary = summarizeSubscriptions(owned);
      return {
        admin,
        stats: {
          ...summary,
          customerCount: bundles.length,
          activeCustomerCount: bundles.filter((b) => b.status === 'active').length,
          pendingCustomerCount: bundles.filter((b) => b.status === 'pending').length,
          expiredCustomerCount: bundles.filter((b) => b.status === 'expired').length,
        },
        bundles,
      };
    })
  );
}

export interface IptvDashboardResult {
  currentAdmin: AdminRequestContext['current']['admin'];
  bundles: ReturnType<typeof buildSubscriptionBundles>;
  overview: ReturnType<typeof summarizeSubscriptions> & {
    customerCount: number;
    activeCustomerCount: number;
    pendingCustomerCount: number;
    expiredCustomerCount: number;
  };
  filteredCount: number;
  hierarchy: Awaited<ReturnType<typeof buildAdminHierarchy>>;
  admins: {
    id: string;
    role: 'super_admin' | 'admin';
    name: string;
    email: string | null;
    phone: string | null;
    createdAt: string;
    createdByAdminId: string | null;
    subscriberCount: number;
    activeSubscriberCount: number;
    revenueKes: number;
  }[];
}

export async function getIptvDashboard(
  context: AdminRequestContext,
  query: string
): Promise<IptvDashboardResult> {
  const canSeeAll = isSuperAdmin(context.current.admin);
  const allSubscriptions = await getAllSubscriptions();
  const scopedSubscriptions = getScopedSubscriptions(
    allSubscriptions,
    context.current.admin.id,
    canSeeAll
  );
  const decoratedScoped = (await decorateSubscriptions(
    scopedSubscriptions
  )) as BundleableSubscription[];
  const scopedBundles = buildSubscriptionBundles(decoratedScoped);
  const visibleBundles = query
    ? scopedBundles.filter((b) => matchesSubscriptionBundle(b, query))
    : scopedBundles;
  const visibleSubscriptions = visibleBundles.flatMap((b) => b.subscriptions);
  const overview = summarizeSubscriptions(visibleSubscriptions as IptvSubscription[]);

  const hierarchySource = query ? (visibleSubscriptions as IptvSubscription[]) : scopedSubscriptions;
  const hierarchy = await buildAdminHierarchy(
    hierarchySource,
    canSeeAll,
    context.current.admin.id
  );

  return {
    currentAdmin: context.current.admin,
    bundles: visibleBundles,
    overview: {
      ...overview,
      customerCount: visibleBundles.length,
      activeCustomerCount: visibleBundles.filter((b) => b.status === 'active').length,
      pendingCustomerCount: visibleBundles.filter((b) => b.status === 'pending').length,
      expiredCustomerCount: visibleBundles.filter((b) => b.status === 'expired').length,
    },
    filteredCount: visibleBundles.length,
    hierarchy,
    admins: hierarchy.map((node) => ({
      ...node.admin,
      subscriberCount: node.stats.customerCount,
      activeSubscriberCount: node.stats.activeCustomerCount,
      revenueKes: node.stats.totalRevenueKes,
    })),
  };
}
