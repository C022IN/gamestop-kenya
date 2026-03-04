/**
 * IPTV Subscription store
 *
 * In-memory store for IPTV subscriptions.
 * In production, replace with a database (PostgreSQL/Supabase/Planetscale).
 *
 * Credentials are generated locally. Connect a real Xtream Codes panel
 * (or any IPTV API) in provisionCredentials() to deliver live streams.
 */

export type PlanId = '3mo' | '12mo' | '24mo';

export interface IptvPlan {
  id: PlanId;
  name: string;
  months: number;
  kesPrice: number;
  usdPrice: number;
}

export const IPTV_PLANS: Record<PlanId, IptvPlan> = {
  '3mo': { id: '3mo', name: '3 Months', months: 3, kesPrice: 4499, usdPrice: 29.99 },
  '12mo': { id: '12mo', name: '12 Months', months: 12, kesPrice: 14999, usdPrice: 99.99 },
  '24mo': { id: '24mo', name: '24 Months', months: 24, kesPrice: 22499, usdPrice: 149.99 },
};

export interface IptvCredentials {
  m3uUrl: string;
  xtreamHost: string;
  xtreamUsername: string;
  xtreamPassword: string;
  xtreamPort: number;
}

export interface IptvSubscription {
  id: string;
  planId: PlanId;
  planName: string;
  months: number;
  amountKes: number;
  customerName: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'expired';
  checkoutRequestId: string;
  mpesaReceipt?: string;
  credentials?: IptvCredentials;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string
  activatedAt?: string;
}

/** In-memory store — keyed by subscription ID */
const subscriptions = new Map<string, IptvSubscription>();
/** Index by checkoutRequestId for quick callback lookup */
const byCheckoutId = new Map<string, string>(); // checkoutRequestId → subscriptionId
/** Index by email for lookup */
const byEmail = new Map<string, string[]>(); // email → subscriptionId[]
/** Index by phone for lookup */
const byPhone = new Map<string, string[]>(); // phone → subscriptionId[]

function generateId(): string {
  return 'IPTV-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function generateCredentials(subscriptionId: string): IptvCredentials {
  const rand = (len: number) =>
    Math.random().toString(36).slice(2, 2 + len).toLowerCase();

  // Generate Xtream-style credentials
  const username = 'gsk_' + rand(8);
  const password = rand(6) + '_' + rand(6);
  const host = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gamestopkenya.com';

  return {
    xtreamHost: host,
    xtreamPort: 8080,
    xtreamUsername: username,
    xtreamPassword: password,
    m3uUrl: `${host}/api/iptv/stream/${subscriptionId}/playlist.m3u`,
  };
}

export function createPendingSubscription(params: {
  planId: PlanId;
  customerName: string;
  email: string;
  phone: string;
  checkoutRequestId: string;
}): IptvSubscription {
  const { planId, customerName, email, phone, checkoutRequestId } = params;
  const plan = IPTV_PLANS[planId];

  const id = generateId();
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + plan.months);

  const sub: IptvSubscription = {
    id,
    planId,
    planName: plan.name,
    months: plan.months,
    amountKes: plan.kesPrice,
    customerName,
    email: email.toLowerCase().trim(),
    phone,
    status: 'pending',
    checkoutRequestId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  subscriptions.set(id, sub);
  byCheckoutId.set(checkoutRequestId, id);

  const emailKey = email.toLowerCase().trim();
  if (!byEmail.has(emailKey)) byEmail.set(emailKey, []);
  byEmail.get(emailKey)!.push(id);

  if (!byPhone.has(phone)) byPhone.set(phone, []);
  byPhone.get(phone)!.push(id);

  return sub;
}

export function activateSubscription(subscriptionId: string, mpesaReceipt: string): IptvSubscription | null {
  const sub = subscriptions.get(subscriptionId);
  if (!sub) return null;

  const credentials = generateCredentials(subscriptionId);
  const updated: IptvSubscription = {
    ...sub,
    status: 'active',
    mpesaReceipt,
    credentials,
    activatedAt: new Date().toISOString(),
  };

  subscriptions.set(subscriptionId, updated);
  return updated;
}

export function activateByCheckoutId(checkoutRequestId: string, mpesaReceipt: string): IptvSubscription | null {
  const subId = byCheckoutId.get(checkoutRequestId);
  if (!subId) return null;
  return activateSubscription(subId, mpesaReceipt);
}

export function getSubscription(id: string): IptvSubscription | null {
  return subscriptions.get(id) ?? null;
}

export function getSubscriptionByCheckout(checkoutRequestId: string): IptvSubscription | null {
  const id = byCheckoutId.get(checkoutRequestId);
  return id ? (subscriptions.get(id) ?? null) : null;
}

export function lookupSubscriptions(emailOrPhone: string): IptvSubscription[] {
  const key = emailOrPhone.toLowerCase().trim();
  const ids = byEmail.get(key) ?? byPhone.get(emailOrPhone) ?? [];
  return ids.map((id) => subscriptions.get(id)).filter(Boolean) as IptvSubscription[];
}

export function getSubscriptionByEmail(email: string): IptvSubscription[] {
  const ids = byEmail.get(email.toLowerCase().trim()) ?? [];
  return ids.map((id) => subscriptions.get(id)).filter(Boolean) as IptvSubscription[];
}

export function getSubscriptionByPhone(phone: string): IptvSubscription[] {
  const ids = byPhone.get(phone) ?? [];
  return ids.map((id) => subscriptions.get(id)).filter(Boolean) as IptvSubscription[];
}

export function getAllSubscriptions(): IptvSubscription[] {
  return Array.from(subscriptions.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
