import type { IptvSubscription } from '@/lib/iptv-subscriptions';
import { getProfileIdFromPhone } from '@/lib/movie-platform';

type SubscriptionStatus = IptvSubscription['status'];

export interface BundleableSubscription
  extends Pick<
    IptvSubscription,
    | 'id'
    | 'planId'
    | 'planName'
    | 'months'
    | 'amountKes'
    | 'customerName'
    | 'email'
    | 'phone'
    | 'status'
    | 'mpesaReceipt'
    | 'createdAt'
    | 'expiresAt'
    | 'activatedAt'
  > {
  member?: {
    profileId: string;
    accessCode: string;
  };
  assignedAdmin?: {
    id: string;
    role: 'super_admin' | 'admin';
    name: string;
    phone: string | null;
  } | null;
}

export interface SubscriptionCoveragePeriod {
  startedAt: string;
  endedAt: string;
  subscriptionIds: string[];
  planNames: string[];
}

export interface SubscriptionGap {
  startedAt: string;
  endedAt: string;
  durationDays: number;
}

export interface SubscriptionBundle<T extends BundleableSubscription = BundleableSubscription> {
  key: string;
  profileId: string;
  customerName: string;
  email: string;
  phone: string;
  member?: {
    profileId: string;
    accessCode: string;
  };
  status: SubscriptionStatus;
  startedAt: string;
  latestActivityAt: string;
  latestSubscription: T;
  subscriptions: T[];
  periods: SubscriptionCoveragePeriod[];
  gaps: SubscriptionGap[];
  totalRevenueKes: number;
}

const PERIOD_MERGE_TOLERANCE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function toTimestamp(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getCoverageStartTimestamp(subscription: BundleableSubscription): number | null {
  return toTimestamp(subscription.activatedAt) ?? toTimestamp(subscription.createdAt);
}

function getSortTimestamp(subscription: BundleableSubscription): number {
  return (
    getCoverageStartTimestamp(subscription) ??
    toTimestamp(subscription.createdAt) ??
    toTimestamp(subscription.expiresAt) ??
    0
  );
}

function getBundleKey(subscription: BundleableSubscription): string {
  const profileId = subscription.member?.profileId || getProfileIdFromPhone(subscription.phone);
  if (profileId) {
    return `profile:${profileId}`;
  }

  const email = subscription.email.trim().toLowerCase();
  if (email) {
    return `email:${email}`;
  }

  return `subscription:${subscription.id}`;
}

function getBundleStatus<T extends BundleableSubscription>(subscriptions: T[]): SubscriptionStatus {
  if (subscriptions.some((subscription) => subscription.status === 'active')) {
    return 'active';
  }

  const latest = subscriptions[0];
  return latest?.status ?? 'expired';
}

function buildPeriods<T extends BundleableSubscription>(
  subscriptions: T[]
): { periods: SubscriptionCoveragePeriod[]; gaps: SubscriptionGap[] } {
  const coverageSubscriptions = [...subscriptions]
    .filter((subscription) => subscription.status !== 'pending')
    .map((subscription) => {
      const startedAt = getCoverageStartTimestamp(subscription);
      const endedAt = toTimestamp(subscription.expiresAt);
      if (startedAt === null || endedAt === null) {
        return null;
      }

      return {
        subscription,
        startedAt,
        endedAt,
      };
    })
    .filter(
      (
        entry
      ): entry is {
        subscription: T;
        startedAt: number;
        endedAt: number;
      } => entry !== null
    )
    .sort((left, right) => left.startedAt - right.startedAt) as Array<{
    subscription: T;
    startedAt: number;
    endedAt: number;
  }>;

  if (coverageSubscriptions.length === 0) {
    return { periods: [], gaps: [] };
  }

  const periods: Array<{
    startedAt: number;
    endedAt: number;
    subscriptionIds: string[];
    planNames: string[];
  }> = [];
  const gaps: SubscriptionGap[] = [];

  for (const entry of coverageSubscriptions) {
    const current = periods[periods.length - 1];
    if (!current) {
      periods.push({
        startedAt: entry.startedAt,
        endedAt: entry.endedAt,
        subscriptionIds: [entry.subscription.id],
        planNames: [entry.subscription.planName],
      });
      continue;
    }

    if (entry.startedAt <= current.endedAt + PERIOD_MERGE_TOLERANCE_MS) {
      current.endedAt = Math.max(current.endedAt, entry.endedAt);
      current.subscriptionIds.push(entry.subscription.id);
      if (!current.planNames.includes(entry.subscription.planName)) {
        current.planNames.push(entry.subscription.planName);
      }
      continue;
    }

    gaps.push({
      startedAt: new Date(current.endedAt).toISOString(),
      endedAt: new Date(entry.startedAt).toISOString(),
      durationDays: Math.max(1, Math.ceil((entry.startedAt - current.endedAt) / DAY_MS)),
    });
    periods.push({
      startedAt: entry.startedAt,
      endedAt: entry.endedAt,
      subscriptionIds: [entry.subscription.id],
      planNames: [entry.subscription.planName],
    });
  }

  return {
    periods: periods.map((period) => ({
      startedAt: new Date(period.startedAt).toISOString(),
      endedAt: new Date(period.endedAt).toISOString(),
      subscriptionIds: period.subscriptionIds,
      planNames: period.planNames,
    })),
    gaps,
  };
}

export function buildSubscriptionBundles<T extends BundleableSubscription>(
  subscriptions: T[]
): SubscriptionBundle<T>[] {
  const grouped = new Map<string, T[]>();

  for (const subscription of subscriptions) {
    const key = getBundleKey(subscription);
    const current = grouped.get(key) ?? [];
    current.push(subscription);
    grouped.set(key, current);
  }

  return Array.from(grouped.entries())
    .map(([key, entries]) => {
      const sorted = [...entries].sort((left, right) => getSortTimestamp(right) - getSortTimestamp(left));
      const latestSubscription = sorted[0];
      const earliestCreatedAt =
        [...sorted]
          .map((subscription) => toTimestamp(subscription.createdAt))
          .filter((value): value is number => value !== null)
          .sort((left, right) => left - right)[0] ?? getSortTimestamp(sorted[sorted.length - 1]);
      const latestActivityAt =
        [...sorted]
          .map((subscription) => Math.max(getSortTimestamp(subscription), toTimestamp(subscription.expiresAt) ?? 0))
          .sort((left, right) => right - left)[0] ?? getSortTimestamp(latestSubscription);
      const member = sorted.find((subscription) => subscription.member)?.member;
      const profileId = member?.profileId || getProfileIdFromPhone(latestSubscription.phone);
      const { periods, gaps } = buildPeriods(sorted);

      return {
        key,
        profileId,
        customerName: latestSubscription.customerName,
        email: latestSubscription.email,
        phone: latestSubscription.phone,
        member,
        status: getBundleStatus(sorted),
        startedAt: new Date(earliestCreatedAt).toISOString(),
        latestActivityAt: new Date(latestActivityAt).toISOString(),
        latestSubscription,
        subscriptions: sorted,
        periods,
        gaps,
        totalRevenueKes: sorted.reduce((sum, subscription) => sum + subscription.amountKes, 0),
      };
    })
    .sort((left, right) => {
      return new Date(right.latestActivityAt).getTime() - new Date(left.latestActivityAt).getTime();
    });
}

export function matchesSubscriptionBundle<T extends BundleableSubscription>(
  bundle: SubscriptionBundle<T>,
  query: string
): boolean {
  const key = query.trim().toLowerCase();
  if (!key) {
    return true;
  }

  if (
    bundle.customerName.toLowerCase().includes(key) ||
    bundle.email.toLowerCase().includes(key) ||
    bundle.phone.toLowerCase().includes(key) ||
    bundle.profileId.toLowerCase().includes(key) ||
    bundle.member?.accessCode.toLowerCase().includes(key)
  ) {
    return true;
  }

  return bundle.subscriptions.some((subscription) => {
    return (
      subscription.id.toLowerCase().includes(key) ||
      subscription.planName.toLowerCase().includes(key) ||
      (subscription.mpesaReceipt?.toLowerCase().includes(key) ?? false)
    );
  });
}
