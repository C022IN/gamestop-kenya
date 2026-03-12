import 'server-only';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export type BillingLinkKind = 'store_order' | 'iptv_subscription';

export interface BillingLink {
  id: string;
  kind: BillingLinkKind;
  recordId: string;
  stripeSessionId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface BillingLinkRow {
  id: string;
  kind: BillingLinkKind;
  record_id: string;
  stripe_session_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

const linksById = new Map<string, BillingLink>();
const linksBySessionId = new Map<string, string>();
const linksBySubscriptionId = new Map<string, string>();

function generateId() {
  return `bill_${Math.random().toString(36).slice(2, 10)}`;
}

function fromRow(row: BillingLinkRow): BillingLink {
  return {
    id: row.id,
    kind: row.kind,
    recordId: row.record_id,
    stripeSessionId: row.stripe_session_id ?? undefined,
    stripeCustomerId: row.stripe_customer_id ?? undefined,
    stripeSubscriptionId: row.stripe_subscription_id ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function indexLink(link: BillingLink) {
  linksById.set(link.id, link);
  if (link.stripeSessionId) linksBySessionId.set(link.stripeSessionId, link.id);
  if (link.stripeSubscriptionId) linksBySubscriptionId.set(link.stripeSubscriptionId, link.id);
}

export async function createBillingLink(params: {
  kind: BillingLinkKind;
  recordId: string;
  stripeSessionId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  metadata?: Record<string, unknown>;
}): Promise<BillingLink> {
  const now = new Date().toISOString();
  const link: BillingLink = {
    id: generateId(),
    kind: params.kind,
    recordId: params.recordId,
    stripeSessionId: params.stripeSessionId,
    stripeCustomerId: params.stripeCustomerId,
    stripeSubscriptionId: params.stripeSubscriptionId,
    metadata: params.metadata,
    createdAt: now,
    updatedAt: now,
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data } = await supabase
      .from('billing_links')
      .insert({
        id: link.id,
        kind: link.kind,
        record_id: link.recordId,
        stripe_session_id: link.stripeSessionId ?? null,
        stripe_customer_id: link.stripeCustomerId ?? null,
        stripe_subscription_id: link.stripeSubscriptionId ?? null,
        metadata: link.metadata ?? {},
      })
      .select(
        'id, kind, record_id, stripe_session_id, stripe_customer_id, stripe_subscription_id, metadata, created_at, updated_at'
      )
      .maybeSingle();

    if (data) {
      const saved = fromRow(data as BillingLinkRow);
      indexLink(saved);
      return saved;
    }
  }

  indexLink(link);
  return link;
}

export async function updateBillingLink(
  id: string,
  patch: {
    stripeSessionId?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<BillingLink | null> {
  const existing = await getBillingLinkById(id);
  if (!existing) return null;

  const updated: BillingLink = {
    ...existing,
    stripeSessionId: patch.stripeSessionId ?? existing.stripeSessionId,
    stripeCustomerId: patch.stripeCustomerId ?? existing.stripeCustomerId,
    stripeSubscriptionId: patch.stripeSubscriptionId ?? existing.stripeSubscriptionId,
    metadata: patch.metadata ? { ...(existing.metadata ?? {}), ...patch.metadata } : existing.metadata,
    updatedAt: new Date().toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data } = await supabase
      .from('billing_links')
      .update({
        stripe_session_id: updated.stripeSessionId ?? null,
        stripe_customer_id: updated.stripeCustomerId ?? null,
        stripe_subscription_id: updated.stripeSubscriptionId ?? null,
        metadata: updated.metadata ?? {},
        updated_at: updated.updatedAt,
      })
      .eq('id', id)
      .select(
        'id, kind, record_id, stripe_session_id, stripe_customer_id, stripe_subscription_id, metadata, created_at, updated_at'
      )
      .maybeSingle();

    if (data) {
      const saved = fromRow(data as BillingLinkRow);
      indexLink(saved);
      return saved;
    }
  }

  indexLink(updated);
  return updated;
}

export async function getBillingLinkById(id: string): Promise<BillingLink | null> {
  const cached = linksById.get(id);
  if (cached) return cached;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('billing_links')
    .select(
      'id, kind, record_id, stripe_session_id, stripe_customer_id, stripe_subscription_id, metadata, created_at, updated_at'
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;

  const link = fromRow(data as BillingLinkRow);
  indexLink(link);
  return link;
}

export async function getBillingLinkByStripeSessionId(sessionId: string): Promise<BillingLink | null> {
  const cachedId = linksBySessionId.get(sessionId);
  if (cachedId) return getBillingLinkById(cachedId);

  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('billing_links')
    .select(
      'id, kind, record_id, stripe_session_id, stripe_customer_id, stripe_subscription_id, metadata, created_at, updated_at'
    )
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (error || !data) return null;

  const link = fromRow(data as BillingLinkRow);
  indexLink(link);
  return link;
}

export async function getBillingLinkByStripeSubscriptionId(
  subscriptionId: string
): Promise<BillingLink | null> {
  const cachedId = linksBySubscriptionId.get(subscriptionId);
  if (cachedId) return getBillingLinkById(cachedId);

  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('billing_links')
    .select(
      'id, kind, record_id, stripe_session_id, stripe_customer_id, stripe_subscription_id, metadata, created_at, updated_at'
    )
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  if (error || !data) return null;

  const link = fromRow(data as BillingLinkRow);
  indexLink(link);
  return link;
}
