/**
 * IPTV Subscription store
 *
 * Falls back to in-memory storage when Supabase is not configured.
 */
import { provisionCredentials } from '@/lib/iptv-provisioning';
import { SUPER_ADMIN_ID } from '@/lib/admin-auth';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export type PlanId = '1wk' | '1mo' | '3mo' | '12mo' | '24mo';

export interface IptvPlan {
  id: PlanId;
  name: string;
  /** Duration in days (used for weekly/daily plans) */
  days?: number;
  /** Duration in months (used for monthly+ plans) */
  months?: number;
  kesPrice: number;
  usdPrice: number;
}

export const IPTV_PLANS: Record<PlanId, IptvPlan> = {
  '1wk':  { id: '1wk',  name: '1 Week',    days: 7,   kesPrice: 500,   usdPrice: 3.99 },
  '1mo':  { id: '1mo',  name: '1 Month',   months: 1,  kesPrice: 1499,  usdPrice: 9.99 },
  '3mo':  { id: '3mo',  name: '3 Months',  months: 3,  kesPrice: 4499,  usdPrice: 29.99 },
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
  createdAt: string;
  expiresAt: string;
  activatedAt?: string;
  assignedAdminId: string;
  assignedAt: string;
  assignedByAdminId: string | null;
}

interface SubscriptionRow {
  id: string;
  plan_id: PlanId;
  plan_name: string;
  months: number;
  amount_kes: number;
  customer_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'expired';
  checkout_request_id: string;
  mpesa_receipt: string | null;
  created_at: string;
  expires_at: string;
  activated_at: string | null;
  assigned_admin_id: string;
  assigned_at: string;
  assigned_by_admin_id: string | null;
  activation_in_progress: boolean;
}

interface CredentialsRow {
  subscription_id: string;
  m3u_url: string;
  xtream_host: string;
  xtream_username: string;
  xtream_password: string;
  xtream_port: number;
}

const subscriptions = new Map<string, IptvSubscription>();
const byCheckoutId = new Map<string, string>();
const byEmail = new Map<string, string[]>();
const byPhone = new Map<string, string[]>();
const activationLocks = new Set<string>();
const SUBSCRIPTION_SELECT =
  'id, plan_id, plan_name, months, amount_kes, customer_name, email, phone, status, checkout_request_id, mpesa_receipt, created_at, expires_at, activated_at, assigned_admin_id, assigned_at, assigned_by_admin_id, activation_in_progress';
const ACTIVATION_WAIT_MS = 250;
const ACTIVATION_WAIT_ATTEMPTS = 12;

function generateId(): string {
  return 'IPTV-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function addPlanDuration(baseDate: Date, plan: IptvPlan) {
  const next = new Date(baseDate);
  if (plan.days) {
    next.setDate(next.getDate() + plan.days);
    return next;
  }

  next.setMonth(next.getMonth() + (plan.months ?? 1));
  return next;
}

function getExpiryTimestamp(expiresAt: string): number | null {
  const value = new Date(expiresAt).getTime();
  return Number.isNaN(value) ? null : value;
}

export function isSubscriptionExpired(
  subscription: Pick<IptvSubscription, 'status' | 'expiresAt'>,
  now = Date.now()
): boolean {
  if (subscription.status === 'pending') {
    return false;
  }

  const expiryTime = getExpiryTimestamp(subscription.expiresAt);
  return expiryTime !== null && expiryTime <= now;
}

export function hasSubscriptionPlaybackAccess(
  subscription: Pick<IptvSubscription, 'status' | 'expiresAt'>,
  now = Date.now()
): boolean {
  return subscription.status === 'active' && !isSubscriptionExpired(subscription, now);
}

function normalizeSubscriptionStatus(subscription: IptvSubscription): IptvSubscription {
  if (!isSubscriptionExpired(subscription)) {
    return subscription;
  }

  return {
    ...subscription,
    status: 'expired',
  };
}

async function persistNormalizedSubscription(
  subscription: IptvSubscription
): Promise<IptvSubscription> {
  const normalized = normalizeSubscriptionStatus(subscription);
  if (normalized.status === subscription.status) {
    indexSubscription(subscription);
    return subscription;
  }

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase
      .from('iptv_subscriptions')
      .update({ status: normalized.status })
      .eq('id', normalized.id);
  }

  indexSubscription(normalized);
  return normalized;
}

function fromCredentialsRow(row: CredentialsRow): IptvCredentials {
  return {
    m3uUrl: row.m3u_url,
    xtreamHost: row.xtream_host,
    xtreamUsername: row.xtream_username,
    xtreamPassword: row.xtream_password,
    xtreamPort: row.xtream_port,
  };
}

function fromSubscriptionRow(
  row: SubscriptionRow,
  credentials?: IptvCredentials | null
): IptvSubscription {
  return {
    id: row.id,
    planId: row.plan_id,
    planName: row.plan_name,
    months: row.months,
    amountKes: row.amount_kes,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    checkoutRequestId: row.checkout_request_id,
    mpesaReceipt: row.mpesa_receipt ?? undefined,
    credentials: credentials ?? undefined,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    activatedAt: row.activated_at ?? undefined,
    assignedAdminId: row.assigned_admin_id,
    assignedAt: row.assigned_at,
    assignedByAdminId: row.assigned_by_admin_id,
  };
}

function indexSubscription(sub: IptvSubscription) {
  subscriptions.set(sub.id, sub);
  byCheckoutId.set(sub.checkoutRequestId, sub.id);

  const emailKey = sub.email.toLowerCase().trim();
  if (!byEmail.has(emailKey)) {
    byEmail.set(emailKey, []);
  }
  if (!byEmail.get(emailKey)?.includes(sub.id)) {
    byEmail.get(emailKey)?.push(sub.id);
  }

  if (!byPhone.has(sub.phone)) {
    byPhone.set(sub.phone, []);
  }
  if (!byPhone.get(sub.phone)?.includes(sub.id)) {
    byPhone.get(sub.phone)?.push(sub.id);
  }
}

async function getCredentialsMap(subscriptionIds: string[]): Promise<Map<string, IptvCredentials>> {
  const supabase = getSupabaseAdminClient();
  if (!supabase || subscriptionIds.length === 0) {
    return new Map(
      subscriptionIds
        .map((id) => {
          const credentials = subscriptions.get(id)?.credentials;
          return credentials ? ([id, credentials] as const) : null;
        })
        .filter(Boolean) as Array<readonly [string, IptvCredentials]>
    );
  }

  const { data, error } = await supabase
    .from('iptv_credentials')
    .select('subscription_id, m3u_url, xtream_host, xtream_username, xtream_password, xtream_port')
    .in('subscription_id', subscriptionIds);

  if (error || !data) {
    return new Map();
  }

  return new Map(
    (data as CredentialsRow[]).map((row) => [row.subscription_id, fromCredentialsRow(row)])
  );
}

async function upsertSubscriptionCredentials(
  subscriptionId: string,
  credentials: IptvCredentials,
  provisionedAt: string
) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase.from('iptv_credentials').upsert(
    {
      subscription_id: subscriptionId,
      m3u_url: credentials.m3uUrl,
      xtream_host: credentials.xtreamHost,
      xtream_username: credentials.xtreamUsername,
      xtream_password: credentials.xtreamPassword,
      xtream_port: credentials.xtreamPort,
      provisioned_at: provisionedAt,
    },
    { onConflict: 'subscription_id' }
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForActivationResult(subscriptionId: string): Promise<IptvSubscription | null> {
  for (let attempt = 0; attempt < ACTIVATION_WAIT_ATTEMPTS; attempt += 1) {
    const current = await getSubscription(subscriptionId, { fresh: true });
    if (!current) {
      return null;
    }

    if (hasSubscriptionPlaybackAccess(current) && current.credentials) {
      return current;
    }

    await delay(ACTIVATION_WAIT_MS);
  }

  return getSubscription(subscriptionId, { fresh: true });
}

export async function createPendingSubscription(params: {
  planId: PlanId;
  customerName: string;
  email: string;
  phone: string;
  checkoutRequestId: string;
  assignedAdminId?: string;
  assignedByAdminId?: string | null;
}): Promise<IptvSubscription> {
  const { planId, customerName, email, phone, checkoutRequestId } = params;
  const plan = IPTV_PLANS[planId];

  const id = generateId();
  const now = new Date();
  const expiresAt = addPlanDuration(now, plan);

  const sub: IptvSubscription = {
    id,
    planId,
    planName: plan.name,
    months: plan.months ?? 0,
    amountKes: plan.kesPrice,
    customerName,
    email: email.toLowerCase().trim(),
    phone,
    status: 'pending',
    checkoutRequestId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    assignedAdminId: params.assignedAdminId ?? SUPER_ADMIN_ID,
    assignedAt: now.toISOString(),
    assignedByAdminId: params.assignedByAdminId ?? null,
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase.from('iptv_subscriptions').insert({
      id: sub.id,
      plan_id: sub.planId,
      plan_name: sub.planName,
      months: sub.months,
      amount_kes: sub.amountKes,
      customer_name: sub.customerName,
      email: sub.email,
      phone: sub.phone,
      status: sub.status,
      checkout_request_id: sub.checkoutRequestId,
      created_at: sub.createdAt,
      expires_at: sub.expiresAt,
      assigned_admin_id: sub.assignedAdminId,
      assigned_at: sub.assignedAt,
      assigned_by_admin_id: sub.assignedByAdminId,
      activation_in_progress: false,
    });
  }

  indexSubscription(sub);
  return sub;
}

export async function getSubscription(
  id: string,
  options?: { fresh?: boolean }
): Promise<IptvSubscription | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    const cached = subscriptions.get(id) ?? null;
    return cached ? await persistNormalizedSubscription(cached) : null;
  }

  if (!options?.fresh) {
    const cached = subscriptions.get(id);
    if (cached) {
      return await persistNormalizedSubscription(cached);
    }
  }

  const { data, error } = await supabase
    .from('iptv_subscriptions')
    .select(SUBSCRIPTION_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const credentialsMap = await getCredentialsMap([id]);
  const subscription = fromSubscriptionRow(
    data as SubscriptionRow,
    credentialsMap.get(id) ?? null
  );
  return await persistNormalizedSubscription(subscription);
}

export async function getSubscriptionByCredentials(
  username: string,
  password: string,
  options?: { fresh?: boolean }
): Promise<IptvSubscription | null> {
  const normalizedUsername = username.trim();
  const normalizedPassword = password.trim();
  if (!normalizedUsername || !normalizedPassword) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    const cached =
      Array.from(subscriptions.values()).find(
        (subscription) =>
          subscription.credentials?.xtreamUsername === normalizedUsername &&
          subscription.credentials?.xtreamPassword === normalizedPassword
      ) ?? null;

    return cached ? await persistNormalizedSubscription(cached) : null;
  }

  const { data, error } = await supabase
    .from('iptv_credentials')
    .select('subscription_id')
    .eq('xtream_username', normalizedUsername)
    .eq('xtream_password', normalizedPassword)
    .maybeSingle();

  const subscriptionId = (data as { subscription_id?: string } | null)?.subscription_id;
  if (error || !subscriptionId) {
    return null;
  }

  return getSubscription(subscriptionId, options ?? { fresh: true });
}

export async function getSubscriptionByCheckout(checkoutRequestId: string): Promise<IptvSubscription | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    const id = byCheckoutId.get(checkoutRequestId);
    const cached = id ? (subscriptions.get(id) ?? null) : null;
    return cached ? await persistNormalizedSubscription(cached) : null;
  }

  const { data, error } = await supabase
    .from('iptv_subscriptions')
    .select(SUBSCRIPTION_SELECT)
    .eq('checkout_request_id', checkoutRequestId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const id = (data as SubscriptionRow).id;
  const credentialsMap = await getCredentialsMap([id]);
  const subscription = fromSubscriptionRow(
    data as SubscriptionRow,
    credentialsMap.get(id) ?? null
  );
  return await persistNormalizedSubscription(subscription);
}

export async function activateSubscription(
  subscriptionId: string,
  mpesaReceipt: string,
  options?: {
    assignedAdminId?: string;
    assignedByAdminId?: string | null;
  }
): Promise<IptvSubscription | null> {
  const supabase = getSupabaseAdminClient();
  const existing = await getSubscription(subscriptionId);
  if (!existing) return null;

  if (hasSubscriptionPlaybackAccess(existing) && existing.credentials) {
    return existing;
  }

  const assignedAdminId = options?.assignedAdminId ?? existing.assignedAdminId;
  const assignedByAdminId = options?.assignedByAdminId ?? existing.assignedByAdminId;
  let claim: IptvSubscription | null = null;

  if (supabase) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('iptv_subscriptions')
        .update({
          activation_in_progress: true,
          mpesa_receipt: mpesaReceipt,
          assigned_admin_id: assignedAdminId,
          assigned_at: now,
          assigned_by_admin_id: assignedByAdminId,
        })
        .eq('id', subscriptionId)
        .eq('status', 'pending')
        .eq('activation_in_progress', false)
        .select(SUBSCRIPTION_SELECT)
        .maybeSingle();

      if (data) {
        claim = fromSubscriptionRow(data as SubscriptionRow, existing.credentials ?? null);
        indexSubscription(claim);
        break;
      }

      const ready = await waitForActivationResult(subscriptionId);
      if (ready && hasSubscriptionPlaybackAccess(ready) && ready.credentials) {
        return ready;
      }
    }
  } else {
    if (activationLocks.has(subscriptionId)) {
      const ready = await waitForActivationResult(subscriptionId);
      if (ready && hasSubscriptionPlaybackAccess(ready) && ready.credentials) {
        return ready;
      }
    }

    activationLocks.add(subscriptionId);
    claim = {
      ...existing,
      mpesaReceipt,
      assignedAdminId,
      assignedAt: new Date().toISOString(),
      assignedByAdminId,
    };
  }

  if (!claim) {
    const settled = await waitForActivationResult(subscriptionId);
    if (settled && hasSubscriptionPlaybackAccess(settled) && settled.credentials) {
      return settled;
    }

    return null;
  }

  try {
    const activatedAt = new Date().toISOString();
    const credentials = await provisionCredentials({
      ...claim,
      mpesaReceipt,
    });
    const updated: IptvSubscription = {
      ...claim,
      status: 'active',
      mpesaReceipt,
      credentials,
      activatedAt,
      assignedAdminId,
      assignedAt: activatedAt,
      assignedByAdminId,
    };

    if (supabase) {
      await upsertSubscriptionCredentials(subscriptionId, credentials, activatedAt);

      await supabase
        .from('iptv_subscriptions')
        .update({
          status: updated.status,
          mpesa_receipt: updated.mpesaReceipt ?? null,
          activated_at: updated.activatedAt,
          assigned_admin_id: updated.assignedAdminId,
          assigned_at: updated.assignedAt,
          assigned_by_admin_id: updated.assignedByAdminId,
          activation_in_progress: false,
        })
        .eq('id', subscriptionId);
    }

    indexSubscription(updated);
    return updated;
  } catch (error) {
    if (supabase) {
      await supabase
        .from('iptv_subscriptions')
        .update({
          status: 'pending',
          activation_in_progress: false,
          mpesa_receipt: mpesaReceipt,
          assigned_admin_id: assignedAdminId,
          assigned_at: new Date().toISOString(),
          assigned_by_admin_id: assignedByAdminId,
        })
        .eq('id', subscriptionId);
    }

    throw error;
  } finally {
    if (!supabase) {
      activationLocks.delete(subscriptionId);
    }
  }
}

export async function reprovisionSubscriptionCredentials(
  subscriptionId: string
): Promise<IptvSubscription | null> {
  const existing = await getSubscription(subscriptionId, { fresh: true });
  if (!existing) {
    return null;
  }

  if (!hasSubscriptionPlaybackAccess(existing)) {
    throw new Error('Only active subscriptions can be reprovisioned.');
  }

  const provisionedAt = new Date().toISOString();
  const credentials = await provisionCredentials(existing);
  const updated: IptvSubscription = {
    ...existing,
    credentials,
  };

  await upsertSubscriptionCredentials(subscriptionId, credentials, provisionedAt);
  indexSubscription(updated);
  return updated;
}

export async function activateByCheckoutId(
  checkoutRequestId: string,
  mpesaReceipt: string,
  options?: {
    assignedAdminId?: string;
    assignedByAdminId?: string | null;
  }
): Promise<IptvSubscription | null> {
  const sub = await getSubscriptionByCheckout(checkoutRequestId);
  if (!sub) return null;
  return await activateSubscription(sub.id, mpesaReceipt, options);
}

export async function extendSubscription(
  subscriptionId: string,
  paymentReference?: string
): Promise<IptvSubscription | null> {
  const existing = await getSubscription(subscriptionId);
  if (!existing) return null;

  const plan = IPTV_PLANS[existing.planId];
  const baseDate =
    new Date(existing.expiresAt).getTime() > Date.now()
      ? new Date(existing.expiresAt)
      : new Date();
  const nextExpiresAt = addPlanDuration(baseDate, plan).toISOString();
  const updated: IptvSubscription = {
    ...existing,
    status: 'active',
    expiresAt: nextExpiresAt,
    mpesaReceipt: paymentReference ?? existing.mpesaReceipt,
    activatedAt: existing.activatedAt ?? new Date().toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase
      .from('iptv_subscriptions')
      .update({
        status: updated.status,
        expires_at: updated.expiresAt,
        mpesa_receipt: updated.mpesaReceipt ?? null,
        activated_at: updated.activatedAt ?? null,
      })
      .eq('id', subscriptionId);
  }

  indexSubscription(updated);
  return updated;
}

export async function getAllSubscriptions(): Promise<IptvSubscription[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    const normalized = await Promise.all(
      Array.from(subscriptions.values()).map((subscription) =>
        persistNormalizedSubscription(subscription)
      )
    );
    return normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const { data, error } = await supabase
    .from('iptv_subscriptions')
    .select(SUBSCRIPTION_SELECT)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  const rows = data as SubscriptionRow[];
  const credentialsMap = await getCredentialsMap(rows.map((row) => row.id));
  const mapped = rows.map((row) =>
    fromSubscriptionRow(row, credentialsMap.get(row.id) ?? null)
  );
  return await Promise.all(mapped.map((subscription) => persistNormalizedSubscription(subscription)));
}

export function searchSubscriptions(
  query: string,
  source: IptvSubscription[]
): IptvSubscription[] {
  const key = query.toLowerCase().trim();
  if (!key) return source;

  return source.filter((subscription) => {
    return (
      subscription.id.toLowerCase().includes(key) ||
      subscription.customerName.toLowerCase().includes(key) ||
      subscription.email.toLowerCase().includes(key) ||
      subscription.phone.toLowerCase().includes(key) ||
      subscription.planName.toLowerCase().includes(key) ||
      (subscription.mpesaReceipt?.toLowerCase().includes(key) ?? false)
    );
  });
}

export async function getSubscriptionsByAdminId(adminId: string): Promise<IptvSubscription[]> {
  const all = await getAllSubscriptions();
  return all.filter((subscription) => subscription.assignedAdminId === adminId);
}

export async function assignSubscriptionToAdmin(
  subscriptionId: string,
  assignedAdminId: string,
  assignedByAdminId: string | null
): Promise<IptvSubscription | null> {
  const existing = await getSubscription(subscriptionId);
  if (!existing) return null;

  const updated: IptvSubscription = {
    ...existing,
    assignedAdminId,
    assignedAt: new Date().toISOString(),
    assignedByAdminId,
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase
      .from('iptv_subscriptions')
      .update({
        assigned_admin_id: updated.assignedAdminId,
        assigned_at: updated.assignedAt,
        assigned_by_admin_id: updated.assignedByAdminId,
      })
      .eq('id', subscriptionId);
  }

  indexSubscription(updated);
  return updated;
}
