import { createHmac } from 'node:crypto';
import {
  getSubscription,
  hasSubscriptionPlaybackAccess,
  type IptvSubscription,
} from '@/lib/iptv-subscriptions';
import { normaliseMpesaPhone } from '@/lib/mpesa';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export const MOVIE_SESSION_COOKIE = 'gsm_movie_session';

export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  genres: string[];
  year: number;
  durationMinutes: number;
  maturityRating: string;
  cloudflareStreamUid?: string;
  requiresSignedPlayback?: boolean;
}

export interface MemberProfile {
  profileId: string;
  phone: string;
  accessCode: string;
  createdAt: string;
  lastLoginAt?: string;
  subscriptionIds: string[];
}

export interface MemberSession {
  token: string;
  profileId: string;
  createdAt: string;
  expiresAt: string;
}

export interface Entitlement {
  profileId: string;
  contentItemId: string;
  subscriptionId: string;
  grantedAt: string;
  expiresAt: string;
}

export interface PlaybackSource {
  iframeUrl: string;
  hlsUrl: string;
  dashUrl: string;
  signed: boolean;
  streamUid: string;
}

export interface MovieMembershipState {
  subscriptions: IptvSubscription[];
  activeSubscriptions: IptvSubscription[];
  latestSubscription: IptvSubscription | null;
  hasActiveSubscription: boolean;
}

interface ContentItemRow {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  genres: string[];
  year: number;
  duration_minutes: number;
  maturity_rating: string;
  cloudflare_stream_uid: string | null;
  requires_signed_playback: boolean;
}

interface MemberProfileRow {
  profile_id: string;
  phone: string;
  access_code: string;
  created_at: string;
  last_login_at: string | null;
  subscription_ids: string[] | null;
}

interface MemberSessionRow {
  token: string;
  profile_id: string;
  created_at: string;
  expires_at: string;
}

interface EntitlementRow {
  profile_id: string;
  content_item_id: string;
  subscription_id: string;
  granted_at: string;
  expires_at: string;
}

const memberProfiles = new Map<string, MemberProfile>();
const memberSessions = new Map<string, MemberSession>();
const memberEntitlements = new Map<string, Entitlement[]>();

function generateAccessCode(length = 8): string {
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
}

function getMovieTokenSecret(): string {
  return (
    process.env.ADMIN_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    'movie-dev-fallback-secret'
  );
}

function generateSessionToken(profileId: string, expiresAt: string): string {
  const payload = `${profileId}|${expiresAt}`;
  const sig = createHmac('sha256', getMovieTokenSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}

function verifySessionToken(token: string): { profileId: string; expiresAt: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split('|');
    if (parts.length < 3) return null;
    const sig = parts[parts.length - 1];
    const payload = parts.slice(0, -1).join('|');
    const expectedSig = createHmac('sha256', getMovieTokenSecret()).update(payload).digest('hex');
    if (sig !== expectedSig) return null;
    const [profileId, expiresAt] = payload.split('|');
    if (!profileId || !expiresAt) return null;
    return { profileId, expiresAt };
  } catch {
    return null;
  }
}

function getCustomerCode(): string | null {
  return process.env.CF_STREAM_CUSTOMER_CODE ?? process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE ?? null;
}

async function createSignedPlaybackToken(streamUid: string): Promise<string | null> {
  const accountId = process.env.CF_STREAM_ACCOUNT_ID;
  const apiToken = process.env.CF_STREAM_API_TOKEN;
  if (!accountId || !apiToken) return null;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamUid}/token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 30 }),
      cache: 'no-store',
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return (data?.result?.token as string | undefined) ?? null;
}

const CONTENT_ITEMS: ContentItem[] = [
  {
    id: 'content-001',
    slug: 'the-last-kickoff',
    title: 'The Last Kickoff',
    synopsis:
      'A retiring striker gets one final chance at continental glory while mentoring a rising academy star.',
    genres: ['Sports', 'Drama'],
    year: 2026,
    durationMinutes: 122,
    maturityRating: '13+',
    cloudflareStreamUid: process.env.CF_STREAM_UID_LAST_KICKOFF,
    requiresSignedPlayback: process.env.CF_STREAM_SIGNED_PLAYBACK === 'true',
  },
  {
    id: 'content-002',
    slug: 'silent-grid',
    title: 'Silent Grid',
    synopsis:
      'When a citywide blackout knocks out mobile networks, a gamer-led crew uses analog radio and street maps to restore communications.',
    genres: ['Sci-Fi', 'Thriller'],
    year: 2025,
    durationMinutes: 110,
    maturityRating: '16+',
    cloudflareStreamUid: process.env.CF_STREAM_UID_SILENT_GRID,
    requiresSignedPlayback: process.env.CF_STREAM_SIGNED_PLAYBACK === 'true',
  },
  {
    id: 'content-003',
    slug: 'market-day',
    title: 'Market Day',
    synopsis:
      'A food vendor and a radio producer build a surprise local hit show while trying to keep a crowded market together.',
    genres: ['Drama', 'Comedy'],
    year: 2024,
    durationMinutes: 101,
    maturityRating: '13+',
    cloudflareStreamUid: process.env.CF_STREAM_UID_MARKET_DAY,
    requiresSignedPlayback: process.env.CF_STREAM_SIGNED_PLAYBACK === 'true',
  },
];

function fromContentRow(row: ContentItemRow): ContentItem {
  const fallback = CONTENT_ITEMS.find((item) => item.id === row.id || item.slug === row.slug);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    synopsis: row.synopsis,
    genres: row.genres ?? [],
    year: row.year,
    durationMinutes: row.duration_minutes,
    maturityRating: row.maturity_rating,
    cloudflareStreamUid: row.cloudflare_stream_uid ?? fallback?.cloudflareStreamUid ?? undefined,
    requiresSignedPlayback: row.requires_signed_playback ?? fallback?.requiresSignedPlayback ?? false,
  };
}

function fromProfileRow(row: MemberProfileRow): MemberProfile {
  return {
    profileId: row.profile_id,
    phone: row.phone,
    accessCode: row.access_code,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? undefined,
    subscriptionIds: row.subscription_ids ?? [],
  };
}

function fromSessionRow(row: MemberSessionRow): MemberSession {
  return {
    token: row.token,
    profileId: row.profile_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

function fromEntitlementRow(row: EntitlementRow): Entitlement {
  return {
    profileId: row.profile_id,
    contentItemId: row.content_item_id,
    subscriptionId: row.subscription_id,
    grantedAt: row.granted_at,
    expiresAt: row.expires_at,
  };
}

export function getProfileIdFromPhone(phone: string): string {
  return normaliseMpesaPhone(phone);
}

export async function getContentItems(): Promise<ContentItem[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return CONTENT_ITEMS;
  }

  const { data, error } = await supabase
    .from('movie_content_items')
    .select(
      'id, slug, title, synopsis, genres, year, duration_minutes, maturity_rating, cloudflare_stream_uid, requires_signed_playback'
    )
    .eq('is_published', true)
    .order('year', { ascending: false });

  if (error || !data || data.length === 0) {
    await supabase.from('movie_content_items').upsert(
      CONTENT_ITEMS.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        synopsis: item.synopsis,
        genres: item.genres,
        year: item.year,
        duration_minutes: item.durationMinutes,
        maturity_rating: item.maturityRating,
        cloudflare_stream_uid: item.cloudflareStreamUid ?? null,
        requires_signed_playback: item.requiresSignedPlayback ?? false,
        is_published: true,
      })),
      { onConflict: 'id' }
    );
    return CONTENT_ITEMS;
  }

  return (data as ContentItemRow[]).map(fromContentRow);
}

export async function getContentItemBySlug(slug: string): Promise<ContentItem | null> {
  const items = await getContentItems();
  return items.find((item) => item.slug === slug) ?? null;
}

async function upsertEntitlements(profileId: string, subscription: IptvSubscription) {
  const currentItems = await getContentItems();
  const now = new Date().toISOString();
  const next = currentItems.map((item) => ({
    profile_id: profileId,
    content_item_id: item.id,
    subscription_id: subscription.id,
    granted_at: now,
    expires_at: subscription.expiresAt,
  }));

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase.from('movie_entitlements').upsert(next, {
      onConflict: 'profile_id,content_item_id,subscription_id',
    });
    return;
  }

  const current = memberEntitlements.get(profileId) ?? [];
  const otherSubscriptions = current.filter(
    (entitlement) => entitlement.subscriptionId !== subscription.id
  );
  memberEntitlements.set(
    profileId,
    [...otherSubscriptions, ...next.map((item) => fromEntitlementRow(item))]
  );
}

export async function provisionMemberFromSubscription(
  subscription: IptvSubscription
): Promise<MemberProfile> {
  const profileId = getProfileIdFromPhone(subscription.phone);
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { data } = await supabase
      .from('movie_profiles')
      .select('profile_id, phone, access_code, created_at, last_login_at, subscription_ids')
      .eq('profile_id', profileId)
      .maybeSingle();

    const existing = data ? fromProfileRow(data as MemberProfileRow) : null;
    const profile: MemberProfile = existing
      ? {
          ...existing,
          phone: profileId,
          subscriptionIds: Array.from(new Set([...existing.subscriptionIds, subscription.id])),
        }
      : {
          profileId,
          phone: profileId,
          accessCode: generateAccessCode(),
          createdAt: now,
          subscriptionIds: [subscription.id],
        };

    await supabase.from('movie_profiles').upsert(
      {
        profile_id: profile.profileId,
        phone: profile.phone,
        access_code: profile.accessCode,
        created_at: profile.createdAt,
        last_login_at: profile.lastLoginAt ?? null,
        subscription_ids: profile.subscriptionIds,
      },
      { onConflict: 'profile_id' }
    );

    await upsertEntitlements(profileId, subscription);
    return profile;
  }

  const existing = memberProfiles.get(profileId);
  const profile: MemberProfile = existing
    ? {
        ...existing,
        phone: profileId,
        subscriptionIds: Array.from(new Set([...existing.subscriptionIds, subscription.id])),
      }
    : {
        profileId,
        phone: profileId,
        accessCode: generateAccessCode(),
        createdAt: now,
        subscriptionIds: [subscription.id],
      };

  memberProfiles.set(profileId, profile);
  await upsertEntitlements(profileId, subscription);
  return profile;
}

export async function createMovieSession(profileId: string): Promise<MemberSession | null> {
  const profile = await getProfileById(profileId);
  if (!profile) return null;

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);

  const session: MemberSession = {
    token: generateSessionToken(profileId, expiresAt.toISOString()),
    profileId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase
      .from('movie_profiles')
      .update({ last_login_at: now.toISOString() })
      .eq('profile_id', profileId);

    await supabase.from('movie_sessions').upsert(
      {
        token: session.token,
        profile_id: session.profileId,
        created_at: session.createdAt,
        expires_at: session.expiresAt,
      },
      { onConflict: 'token' }
    );
  } else {
    memberProfiles.set(profileId, { ...profile, lastLoginAt: now.toISOString() });
    memberSessions.set(session.token, session);
  }

  return session;
}

export async function getProfileByAccessCode(
  phone: string,
  accessCode: string
): Promise<MemberProfile | null> {
  const profileId = getProfileIdFromPhone(phone);
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('movie_profiles')
      .select('profile_id, phone, access_code, created_at, last_login_at, subscription_ids')
      .eq('profile_id', profileId)
      .eq('access_code', accessCode.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return fromProfileRow(data as MemberProfileRow);
  }

  const profile = memberProfiles.get(profileId);
  if (!profile) return null;
  return profile.accessCode === accessCode.trim().toUpperCase() ? profile : null;
}

export async function getSessionByToken(token: string): Promise<MemberSession | null> {
  const supabase = getSupabaseAdminClient();
  let session: MemberSession | null = null;

  if (supabase) {
    const { data, error } = await supabase
      .from('movie_sessions')
      .select('token, profile_id, created_at, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (!error && data) {
      session = fromSessionRow(data as MemberSessionRow);
    }
  } else {
    session = memberSessions.get(token) ?? null;
    if (!session) {
      const verified = verifySessionToken(token);
      if (verified) {
        session = {
          token,
          profileId: verified.profileId,
          createdAt: new Date().toISOString(),
          expiresAt: verified.expiresAt,
        };
      }
    }
  }

  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await destroyMovieSession(token);
    return null;
  }

  return session;
}

export async function destroyMovieSession(token: string) {
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase.from('movie_sessions').delete().eq('token', token);
    return;
  }

  memberSessions.delete(token);
}

export async function getProfileById(profileId: string): Promise<MemberProfile | null> {
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('movie_profiles')
      .select('profile_id, phone, access_code, created_at, last_login_at, subscription_ids')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return fromProfileRow(data as MemberProfileRow);
  }

  return memberProfiles.get(profileId) ?? null;
}

export async function getEntitlementsForProfile(profileId: string): Promise<Entitlement[]> {
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('movie_entitlements')
      .select('profile_id, content_item_id, subscription_id, granted_at, expires_at')
      .eq('profile_id', profileId)
      .gt('expires_at', new Date().toISOString());

    if (error || !data) {
      return [];
    }

    return (data as EntitlementRow[]).map(fromEntitlementRow);
  }

  const now = Date.now();
  return (memberEntitlements.get(profileId) ?? []).filter(
    (entitlement) => new Date(entitlement.expiresAt).getTime() > now
  );
}

export async function getAccessibleContentForProfile(profileId: string): Promise<ContentItem[]> {
  const entitledIds = new Set(
    (await getEntitlementsForProfile(profileId)).map((item) => item.contentItemId)
  );
  const items = await getContentItems();
  return items.filter((item) => entitledIds.has(item.id));
}

export async function getActiveSubscriptionsForProfile(
  profileId: string
): Promise<IptvSubscription[]> {
  return (await getMovieMembershipState(profileId)).activeSubscriptions;
}

export async function getSubscriptionsForProfile(
  profileId: string
): Promise<IptvSubscription[]> {
  const profile = await getProfileById(profileId);
  if (!profile) {
    return [];
  }

  const subscriptions = await Promise.all(
    profile.subscriptionIds.map((subscriptionId) => getSubscription(subscriptionId))
  );

  return subscriptions
    .filter((subscription): subscription is IptvSubscription => Boolean(subscription))
    .sort((left, right) => {
      const leftExpiry = new Date(left.expiresAt).getTime();
      const rightExpiry = new Date(right.expiresAt).getTime();

      if (!Number.isNaN(rightExpiry) && !Number.isNaN(leftExpiry) && rightExpiry !== leftExpiry) {
        return rightExpiry - leftExpiry;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
}

export async function getMovieMembershipState(
  profileId: string
): Promise<MovieMembershipState> {
  const subscriptions = await getSubscriptionsForProfile(profileId);
  const activeSubscriptions = subscriptions.filter((subscription) =>
    hasSubscriptionPlaybackAccess(subscription)
  );

  return {
    subscriptions,
    activeSubscriptions,
    latestSubscription: activeSubscriptions[0] ?? subscriptions[0] ?? null,
    hasActiveSubscription: activeSubscriptions.length > 0,
  };
}

export async function hasActiveSubscriptionForProfile(profileId: string): Promise<boolean> {
  return (await getMovieMembershipState(profileId)).hasActiveSubscription;
}

export async function canAccessContent(
  profileId: string,
  contentItemId: string
): Promise<boolean> {
  const entitlements = await getEntitlementsForProfile(profileId);
  return entitlements.some((item) => item.contentItemId === contentItemId);
}

export async function buildPlaybackSource(content: ContentItem): Promise<PlaybackSource | null> {
  const streamUid = content.cloudflareStreamUid;
  const customerCode = getCustomerCode();
  if (!streamUid || !customerCode) return null;

  let playerKey = streamUid;
  let signed = false;

  if (content.requiresSignedPlayback) {
    const token = await createSignedPlaybackToken(streamUid);
    if (!token) return null;
    playerKey = token;
    signed = true;
  }

  return {
    iframeUrl: `https://customer-${customerCode}.cloudflarestream.com/${playerKey}/iframe`,
    hlsUrl: `https://customer-${customerCode}.cloudflarestream.com/${playerKey}/manifest/video.m3u8`,
    dashUrl: `https://customer-${customerCode}.cloudflarestream.com/${playerKey}/manifest/video.mpd`,
    signed,
    streamUid,
  };
}
