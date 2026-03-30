import {
  hasSubscriptionPlaybackAccess,
  isSubscriptionExpired,
  type IptvSubscription,
} from '@/lib/iptv-subscriptions';

export interface SubscriptionPlanBreakdown {
  planId: string;
  planName: string;
  count: number;
  revenueKes: number;
}

export interface SubscriptionOverview {
  totalSubscriptions: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenueKes: number;
  activeRevenueKes: number;
  averageOrderValueKes: number;
  expiringWithin30Days: number;
  planBreakdown: SubscriptionPlanBreakdown[];
}

export function summarizeSubscriptions(subscriptions: IptvSubscription[]): SubscriptionOverview {
  const now = Date.now();
  const warningWindow = now + 30 * 24 * 60 * 60 * 1000;

  const planBreakdown = new Map<string, SubscriptionPlanBreakdown>();
  let activeSubscriptions = 0;
  let pendingSubscriptions = 0;
  let expiredSubscriptions = 0;
  let totalRevenueKes = 0;
  let activeRevenueKes = 0;
  let expiringWithin30Days = 0;

  for (const subscription of subscriptions) {
    totalRevenueKes += subscription.amountKes;

    if (hasSubscriptionPlaybackAccess(subscription, now)) {
      activeSubscriptions += 1;
      activeRevenueKes += subscription.amountKes;

      const expiryTime = new Date(subscription.expiresAt).getTime();
      if (!Number.isNaN(expiryTime) && expiryTime >= now && expiryTime <= warningWindow) {
        expiringWithin30Days += 1;
      }
    } else if (subscription.status === 'pending') {
      pendingSubscriptions += 1;
    } else if (subscription.status === 'expired' || isSubscriptionExpired(subscription, now)) {
      expiredSubscriptions += 1;
    }

    const existing = planBreakdown.get(subscription.planId);
    if (existing) {
      existing.count += 1;
      existing.revenueKes += subscription.amountKes;
    } else {
      planBreakdown.set(subscription.planId, {
        planId: subscription.planId,
        planName: subscription.planName,
        count: 1,
        revenueKes: subscription.amountKes,
      });
    }
  }

  return {
    totalSubscriptions: subscriptions.length,
    activeSubscriptions,
    pendingSubscriptions,
    expiredSubscriptions,
    totalRevenueKes,
    activeRevenueKes,
    averageOrderValueKes:
      subscriptions.length > 0 ? Math.round(totalRevenueKes / subscriptions.length) : 0,
    expiringWithin30Days,
    planBreakdown: Array.from(planBreakdown.values()).sort((a, b) => b.count - a.count),
  };
}
