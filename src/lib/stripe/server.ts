import 'server-only';
import Stripe from 'stripe';
import { getStripeSecretKey, hasStripeServerEnv } from '@/lib/stripe/env';

let cachedClient: Stripe | null | undefined;

export function getStripeServerClient(): Stripe | null {
  if (!hasStripeServerEnv()) {
    return null;
  }

  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new Stripe(secretKey);
  return cachedClient;
}
