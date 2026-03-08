import type { IptvSubscription } from '@/lib/iptv-subscriptions';
import { normaliseMpesaPhone } from '@/lib/mpesa';

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

const memberProfiles = new Map<string, MemberProfile>();
const memberSessions = new Map<string, MemberSession>();
const memberEntitlements = new Map<string, Entitlement[]>();

function generateAccessCode(length = 8): string {
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
}

function generateSessionToken(): string {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
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

export function getProfileIdFromPhone(phone: string): string {
  return normaliseMpesaPhone(phone);
}

export function getContentItems(): ContentItem[] {
  return CONTENT_ITEMS;
}

export function getContentItemBySlug(slug: string): ContentItem | null {
  return CONTENT_ITEMS.find((item) => item.slug === slug) ?? null;
}

export function provisionMemberFromSubscription(subscription: IptvSubscription): MemberProfile {
  const profileId = getProfileIdFromPhone(subscription.phone);
  const existing = memberProfiles.get(profileId);
  const now = new Date().toISOString();

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
  grantEntitlements(profileId, subscription);
  return profile;
}

function grantEntitlements(profileId: string, subscription: IptvSubscription) {
  const current = memberEntitlements.get(profileId) ?? [];
  const now = new Date().toISOString();

  const next = CONTENT_ITEMS.map((item) => {
    const existing = current.find(
      (entitlement) =>
        entitlement.subscriptionId === subscription.id && entitlement.contentItemId === item.id
    );

    return (
      existing ?? {
        profileId,
        contentItemId: item.id,
        subscriptionId: subscription.id,
        grantedAt: now,
        expiresAt: subscription.expiresAt,
      }
    );
  });

  const otherSubscriptions = current.filter(
    (entitlement) => entitlement.subscriptionId !== subscription.id
  );
  memberEntitlements.set(profileId, [...otherSubscriptions, ...next]);
}

export function createMovieSession(profileId: string): MemberSession | null {
  const profile = memberProfiles.get(profileId);
  if (!profile) return null;

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);

  const session: MemberSession = {
    token: generateSessionToken(),
    profileId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  profile.lastLoginAt = now.toISOString();
  memberProfiles.set(profileId, profile);
  memberSessions.set(session.token, session);
  return session;
}

export function getProfileByAccessCode(phone: string, accessCode: string): MemberProfile | null {
  const profileId = getProfileIdFromPhone(phone);
  const profile = memberProfiles.get(profileId);
  if (!profile) return null;
  return profile.accessCode === accessCode.trim().toUpperCase() ? profile : null;
}

export function getSessionByToken(token: string): MemberSession | null {
  const session = memberSessions.get(token);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    memberSessions.delete(token);
    return null;
  }

  return session;
}

export function destroyMovieSession(token: string) {
  memberSessions.delete(token);
}

export function getProfileById(profileId: string): MemberProfile | null {
  return memberProfiles.get(profileId) ?? null;
}

export function getEntitlementsForProfile(profileId: string): Entitlement[] {
  const now = Date.now();
  return (memberEntitlements.get(profileId) ?? []).filter(
    (entitlement) => new Date(entitlement.expiresAt).getTime() > now
  );
}

export function getAccessibleContentForProfile(profileId: string): ContentItem[] {
  const entitledIds = new Set(getEntitlementsForProfile(profileId).map((item) => item.contentItemId));
  return CONTENT_ITEMS.filter((item) => entitledIds.has(item.id));
}

export function canAccessContent(profileId: string, contentItemId: string): boolean {
  return getEntitlementsForProfile(profileId).some((item) => item.contentItemId === contentItemId);
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
