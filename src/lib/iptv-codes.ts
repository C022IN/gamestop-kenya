import 'server-only';

import { randomBytes } from 'node:crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { PlanId } from '@/lib/iptv-subscriptions';

export interface IptvAccessCode {
  code: string;          // e.g. GSTV-ABCD-1234
  planId: PlanId;
  planName: string;
  createdByAdminId: string;
  createdAt: string;
  expiresAt: string | null;  // null = never expires until redeemed
  redeemedAt: string | null;
  redeemedByPhone: string | null;
  subscriptionId: string | null;
  note: string | null;
}

/** In-memory fallback when Supabase is not configured */
const codeStore = new Map<string, IptvAccessCode>();

function generateCode(): string {
  const part = () => randomBytes(2).toString('hex').toUpperCase();
  return `GSTV-${part()}-${part()}`;
}

export async function createAccessCodes(params: {
  planId: PlanId;
  planName: string;
  quantity: number;
  createdByAdminId: string;
  note?: string;
}): Promise<IptvAccessCode[]> {
  const { planId, planName, quantity, createdByAdminId, note } = params;
  const now = new Date().toISOString();
  const codes: IptvAccessCode[] = [];

  for (let i = 0; i < Math.min(quantity, 100); i++) {
    const code = generateCode();
    const entry: IptvAccessCode = {
      code,
      planId,
      planName,
      createdByAdminId,
      createdAt: now,
      expiresAt: null,
      redeemedAt: null,
      redeemedByPhone: null,
      subscriptionId: null,
      note: note?.trim() || null,
    };
    codes.push(entry);
  }

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase.from('iptv_access_codes').insert(
      codes.map((c) => ({
        code: c.code,
        plan_id: c.planId,
        plan_name: c.planName,
        created_by_admin_id: c.createdByAdminId,
        created_at: c.createdAt,
        expires_at: c.expiresAt,
        redeemed_at: c.redeemedAt,
        redeemed_by_phone: c.redeemedByPhone,
        subscription_id: c.subscriptionId,
        note: c.note,
      }))
    );
  } else {
    for (const c of codes) codeStore.set(c.code, c);
  }

  return codes;
}

export async function getAccessCode(code: string): Promise<IptvAccessCode | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return codeStore.get(code) ?? null;

  const { data } = await supabase
    .from('iptv_access_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (!data) return null;
  return {
    code: data.code,
    planId: data.plan_id,
    planName: data.plan_name,
    createdByAdminId: data.created_by_admin_id,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    redeemedAt: data.redeemed_at,
    redeemedByPhone: data.redeemed_by_phone,
    subscriptionId: data.subscription_id,
    note: data.note,
  };
}

export async function listAccessCodes(adminId?: string): Promise<IptvAccessCode[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    const all = Array.from(codeStore.values());
    return adminId ? all.filter((c) => c.createdByAdminId === adminId) : all;
  }

  let query = supabase
    .from('iptv_access_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (adminId) query = query.eq('created_by_admin_id', adminId);

  const { data } = await query;
  if (!data) return [];

  return data.map((row: Record<string, string | null>) => ({
    code: row.code as string,
    planId: row.plan_id as PlanId,
    planName: row.plan_name as string,
    createdByAdminId: row.created_by_admin_id as string,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at,
    redeemedAt: row.redeemed_at,
    redeemedByPhone: row.redeemed_by_phone,
    subscriptionId: row.subscription_id,
    note: row.note,
  }));
}

export async function markCodeRedeemed(
  code: string,
  phone: string,
  subscriptionId: string
): Promise<void> {
  const now = new Date().toISOString();
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    await supabase
      .from('iptv_access_codes')
      .update({ redeemed_at: now, redeemed_by_phone: phone, subscription_id: subscriptionId })
      .eq('code', code);
  } else {
    const existing = codeStore.get(code);
    if (existing) {
      codeStore.set(code, { ...existing, redeemedAt: now, redeemedByPhone: phone, subscriptionId });
    }
  }
}
