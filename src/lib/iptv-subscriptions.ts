/**
 * IPTV Subscription store
 *
 * Falls back to in-memory storage when Supabase is not configured.
 */
import { provisionCredentials } from '@/lib/iptv-provisioning';
import { SUPER_ADMIN_ID } from '@/lib/admin-auth';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

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

function generateId(): string {
  return 'IPTV-' + Math.random().toString(36).slice(2, 8).toUpperCase();
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
    });
  }

  indexSubscription(sub);
  return sub;
}

export async function getSubscription(id: string): Promise<IptvSubscription | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return subscriptions.get(id) ?? null;
  }

  const { data, error } = await supabase
    .from('iptv_subscriptions')
    .select(
      'id, plan_id, plan_name, months, amount_kes, customer_name, email, phone, status, checkout_request_id, mpesa_receipt, created_at, expires_at, activated_at, assigned_admin_id, assigned_at, assigned_by_admin_id'
    )
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
  indexSubscription(subscription);
  return subscription;
}

export async function getSubscriptionByCheckout(checkoutRequestId: string): Promise<IptvSubscription | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    const id = byCheckoutId.get(checkoutRequestId);
    return id ? (subscriptions.get(id) ?? null) : null;
  }

  const { data, error } = await supabase
    .from('iptv_subscriptions')
    .select(
      'id, plan_id, plan_name, months, amount_kes, customer_name, email, phone, status, checkout_request_id, mpesa_receipt, created_at, expires_at, activated_at, assigned_admin_id, assigned_at, assigned_by_admin_id'
    )
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
  indexSubscription(subscription);
  return subscription;
}

export async function activateSubscription(
  subscriptionId: string,
  mpesaReceipt: string,
  options?: {
    assignedAdminId?: string;
    assignedByAdminId?: string | null;
  }
): Promise<IptvSubscription | null> {
  const sub = await getSubscription(subscriptionId);
  if (!sub) return null;

  const credentials = await provisionCredentials({
    ...sub,
    mpesaReceipt,
  });
  const updated: IptvSubscription = {
    ...sub,
    status: 'active',
    mpesaReceipt,
    credentials,
    activatedAt: new Date().toISOString(),
    assignedAdminId: options?.assignedAdminId ?? sub.assignedAdminId,
    assignedAt: new Date().toISOString(),
    assignedByAdminId: options?.assignedByAdminId ?? sub.assignedByAdminId,
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase
      .from('iptv_subscriptions')
      .update({
        status: updated.status,
        mpesa_receipt: updated.mpesaReceipt ?? null,
        activated_at: updated.activatedAt,
        assigned_admin_id: updated.assignedAdminId,
        assigned_at: updated.assignedAt,
        assigned_by_admin_id: updated.assignedByAdminId,
      })
      .eq('id', subscriptionId);

    await supabase.from('iptv_credentials').upsert(
      {
        subscription_id: subscriptionId,
        m3u_url: credentials.m3uUrl,
        xtream_host: credentials.xtreamHost,
        xtream_username: credentials.xtreamUsername,
        xtream_password: credentials.xtreamPassword,
        xtream_port: credentials.xtreamPort,
        provisioned_at: updated.activatedAt,
      },
      { onConflict: 'subscription_id' }
    );
  }

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

export async function getAllSubscriptions(): Promise<IptvSubscription[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return Array.from(subscriptions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const { data, error } = await supabase
    .from('iptv_subscriptions')
    .select(
      'id, plan_id, plan_name, months, amount_kes, customer_name, email, phone, status, checkout_request_id, mpesa_receipt, created_at, expires_at, activated_at, assigned_admin_id, assigned_at, assigned_by_admin_id'
    )
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  const rows = data as SubscriptionRow[];
  const credentialsMap = await getCredentialsMap(rows.map((row) => row.id));
  const mapped = rows.map((row) =>
    fromSubscriptionRow(row, credentialsMap.get(row.id) ?? null)
  );
  for (const subscription of mapped) {
    indexSubscription(subscription);
  }
  return mapped;
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
