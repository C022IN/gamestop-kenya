import { getSupabaseAdminClient } from '@/lib/supabase/server';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MoviesSubscriberCredentials {
  m3uUrl: string;
  xtreamHost: string;
  xtreamUsername: string;
  xtreamPassword: string;
  xtreamPort: number;
}

export interface MoviesSubscriber {
  subscriptionId: string;
  profileId: string | null;
  accessCode: string | null;
  customerName: string;
  phone: string;
  email: string;
  planName: string;
  amountKes: number;
  status: 'pending' | 'active' | 'expired';
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string;
  credentials: MoviesSubscriberCredentials | null;
  moviesAdminId: string;
}

export interface MoviesAdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  expiredUsers: number;
  totalRevenueKes: number;
}

interface SubscriptionRow {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  plan_name: string;
  amount_kes: number;
  status: 'pending' | 'active' | 'expired';
  created_at: string;
  activated_at: string | null;
  expires_at: string;
  movies_admin_id: string;
}

interface CredentialsRow {
  subscription_id: string;
  m3u_url: string;
  xtream_host: string;
  xtream_username: string;
  xtream_password: string;
  xtream_port: number;
}

interface ProfileRow {
  profile_id: string;
  phone: string;
  access_code: string;
  subscription_ids: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getMoviesAdminSubscribers(
  moviesAdminId: string,
  isSuperAdmin = false
): Promise<MoviesSubscriber[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  // Fetch subscriptions linked to this movies admin (or all if super admin)
  let subQuery = supabase
    .from('iptv_subscriptions')
    .select(
      'id, customer_name, phone, email, plan_name, amount_kes, status, created_at, activated_at, expires_at, movies_admin_id'
    )
    .order('created_at', { ascending: false });

  if (!isSuperAdmin) {
    subQuery = subQuery.eq('movies_admin_id', moviesAdminId);
  } else {
    subQuery = subQuery.not('movies_admin_id', 'is', null);
  }

  const { data: subscriptions, error: subError } = await subQuery;
  if (subError || !subscriptions || subscriptions.length === 0) return [];

  const subIds = (subscriptions as SubscriptionRow[]).map((s) => s.id);
  const phones = [...new Set((subscriptions as SubscriptionRow[]).map((s) => s.phone))];

  // Fetch credentials and profiles in parallel
  const [credRes, profileRes] = await Promise.all([
    supabase
      .from('iptv_credentials')
      .select('subscription_id, m3u_url, xtream_host, xtream_username, xtream_password, xtream_port')
      .in('subscription_id', subIds),
    supabase
      .from('movie_profiles')
      .select('profile_id, phone, access_code, subscription_ids')
      .in('phone', phones),
  ]);

  const credsBySubId = new Map<string, CredentialsRow>();
  for (const cred of (credRes.data ?? []) as CredentialsRow[]) {
    credsBySubId.set(cred.subscription_id, cred);
  }

  const profileByPhone = new Map<string, ProfileRow>();
  for (const profile of (profileRes.data ?? []) as ProfileRow[]) {
    profileByPhone.set(profile.phone, profile);
  }

  return (subscriptions as SubscriptionRow[]).map((sub) => {
    const cred = credsBySubId.get(sub.id) ?? null;
    const profile = profileByPhone.get(sub.phone) ?? null;

    return {
      subscriptionId: sub.id,
      profileId: profile?.profile_id ?? null,
      accessCode: profile?.access_code ?? null,
      customerName: sub.customer_name,
      phone: sub.phone,
      email: sub.email,
      planName: sub.plan_name,
      amountKes: sub.amount_kes,
      status: sub.status,
      createdAt: sub.created_at,
      activatedAt: sub.activated_at,
      expiresAt: sub.expires_at,
      moviesAdminId: sub.movies_admin_id,
      credentials: cred
        ? {
            m3uUrl: cred.m3u_url,
            xtreamHost: cred.xtream_host,
            xtreamUsername: cred.xtream_username,
            xtreamPassword: cred.xtream_password,
            xtreamPort: cred.xtream_port,
          }
        : null,
    };
  });
}

export function computeMoviesAdminStats(subscribers: MoviesSubscriber[]): MoviesAdminStats {
  return {
    totalUsers: subscribers.length,
    activeUsers: subscribers.filter((s) => s.status === 'active').length,
    pendingUsers: subscribers.filter((s) => s.status === 'pending').length,
    expiredUsers: subscribers.filter((s) => s.status === 'expired').length,
    totalRevenueKes: subscribers.reduce((sum, s) => sum + (s.amountKes ?? 0), 0),
  };
}

/**
 * Link an IPTV subscription (and its movie profile) to a movies admin
 * when a user subscribes via a referral code/link.
 */
export async function linkSubscriptionToMoviesAdmin(
  subscriptionId: string,
  moviesAdminId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, error: 'Database not configured.' };

  const { data: sub, error: subErr } = await supabase
    .from('iptv_subscriptions')
    .select('id, phone, movies_admin_id')
    .eq('id', subscriptionId)
    .maybeSingle();

  if (subErr || !sub) return { ok: false, error: 'Subscription not found.' };

  const existingLink = (sub as { movies_admin_id: string | null }).movies_admin_id;
  if (existingLink) {
    // Already linked — do not overwrite
    return { ok: true };
  }

  const { error: updateSubErr } = await supabase
    .from('iptv_subscriptions')
    .update({ movies_admin_id: moviesAdminId })
    .eq('id', subscriptionId);

  if (updateSubErr) return { ok: false, error: updateSubErr.message };

  // Also update movie_profile if it exists for this phone
  await supabase
    .from('movie_profiles')
    .update({ movies_admin_id: moviesAdminId })
    .eq('phone', (sub as { phone: string }).phone)
    .is('movies_admin_id', null);

  return { ok: true };
}

/**
 * Resolve a movies admin referral code to an admin ID.
 */
export async function resolveMoviesAdminReferralCode(
  referralCode: string
): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('admin_accounts')
    .select('id')
    .eq('referral_code', referralCode)
    .eq('admin_type', 'movies')
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { id: string }).id;
}
