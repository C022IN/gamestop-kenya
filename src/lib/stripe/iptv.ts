import type Stripe from 'stripe';
import type { IptvPlan } from '@/lib/iptv-subscriptions';

export function getIptvStripeRecurring(
  plan: IptvPlan
): Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring {
  if (plan.days) {
    return {
      interval: 'week',
      interval_count: Math.max(1, Math.round(plan.days / 7)),
    };
  }

  if ((plan.months ?? 0) >= 12) {
    return {
      interval: 'year',
      interval_count: Math.max(1, Math.round((plan.months ?? 12) / 12)),
    };
  }

  return {
    interval: 'month',
    interval_count: plan.months ?? 1,
  };
}
