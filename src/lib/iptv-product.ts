import type { IptvSubscription } from '@/lib/iptv-subscriptions';

export type DevicePlatform = 'tv' | 'mobile' | 'web' | 'box';

export interface DeviceOnboardingGuide {
  id: string;
  platform: DevicePlatform;
  title: string;
  headline: string;
  app: string;
  summary: string;
  steps: string[];
}

export const DEVICE_ONBOARDING_GUIDES: DeviceOnboardingGuide[] = [
  {
    id: 'smart-tv',
    platform: 'tv',
    title: 'Smart TV',
    headline: 'Main household screen setup.',
    app: 'IPTV Smarters Pro or TiviMate',
    summary: 'Best for Samsung, LG, Android TV, Google TV, Fire TV, and Apple TV style setups.',
    steps: [
      'Install the player on the TV or streaming stick.',
      'Use the protected playlist URL from the payment screen for the fastest setup path.',
      'If your provider supports it, you can also use the host, username, and password shown after activation.',
    ],
  },
  {
    id: 'mobile',
    platform: 'mobile',
    title: 'Phone and Tablet',
    headline: 'Fast setup on Android or iPhone.',
    app: 'IPTV Smarters Pro or GSE',
    summary: 'Useful for mobile-first customers who want the quickest setup path after payment.',
    steps: [
      'Install the mobile player.',
      'Paste the protected playlist URL or use the provider credentials when supported.',
      'Save favorites for daily access.',
    ],
  },
  {
    id: 'web',
    platform: 'web',
    title: 'Web Browser',
    headline: 'Browser-based playback for laptop users.',
    app: 'Browser-compatible player',
    summary: 'Helpful for quick support sessions and customers who watch from desktop.',
    steps: [
      'Open the browser player.',
      'Log in with the subscription credentials.',
      'Confirm playback before leaving the payment session.',
    ],
  },
  {
    id: 'tv-box',
    platform: 'box',
    title: 'Android Box and Kodi',
    headline: 'Power-user setup for manual players.',
    app: 'Kodi or VLC',
    summary: 'Useful for advanced users who want manual playlists and custom playback.',
    steps: [
      'Open Kodi, VLC, or another compatible player.',
      'Paste the protected playlist URL or configure the provider endpoint if available.',
      'Save the playlist locally after the first successful login.',
    ],
  },
];

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

    if (subscription.status === 'active') {
      activeSubscriptions += 1;
      activeRevenueKes += subscription.amountKes;

      const expiryTime = new Date(subscription.expiresAt).getTime();
      if (!Number.isNaN(expiryTime) && expiryTime >= now && expiryTime <= warningWindow) {
        expiringWithin30Days += 1;
      }
    } else if (subscription.status === 'pending') {
      pendingSubscriptions += 1;
    } else {
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
