import 'server-only';

import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { IptvCredentials, IptvSubscription } from '@/lib/iptv-subscriptions';
import { getAppUrl } from '@/lib/app-url';

export interface IptvProvisioningPayload {
  subscriptionId: string;
  planId?: string;
  planName?: string;
  months?: number;
  amountKes?: number;
  phone?: string;
  customerName?: string;
  email?: string;
  mpesaReceipt?: string;
  expiresAt?: string;
  requestedFormat?: string;
}

function trimEnv(value: string | undefined): string | null {
  const next = value?.trim();
  return next ? next : null;
}

function normalizeUrl(value?: string | null): string | null {
  const next = value?.trim();
  if (!next) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(next) ? next : `https://${next}`;
  return withProtocol.replace(/\/+$/, '');
}

function getProvisioningBaseUrl(origin?: string | null): string {
  const vercelEnv = trimEnv(process.env.VERCEL_ENV)?.toLowerCase();
  if (vercelEnv && vercelEnv !== 'production') {
    return (
      normalizeUrl(origin) ??
      normalizeUrl(process.env.VERCEL_BRANCH_URL) ??
      normalizeUrl(process.env.VERCEL_URL) ??
      getAppUrl(origin)
    );
  }

  return getAppUrl(origin);
}

function randomSegment(length: number): string {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toLowerCase();
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const next = value.trim();
  return next || undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
}

function parseProvisioningToken(headerValue: string | null): string | null {
  const next = headerValue?.trim();
  if (!next) {
    return null;
  }

  if (next.toLowerCase().startsWith('bearer ')) {
    return next.slice(7).trim() || null;
  }

  return next;
}

function tokensMatch(expected: string, actual: string | null): boolean {
  if (!actual) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function buildProvisioningPayload(
  subscription: IptvSubscription
): IptvProvisioningPayload {
  return {
    subscriptionId: subscription.id,
    planId: subscription.planId,
    planName: subscription.planName,
    months: subscription.months,
    amountKes: subscription.amountKes,
    phone: subscription.phone,
    customerName: subscription.customerName,
    email: subscription.email,
    mpesaReceipt: subscription.mpesaReceipt,
    expiresAt: subscription.expiresAt,
    requestedFormat: 'xtream',
  };
}

export function parseProvisioningPayload(value: unknown): IptvProvisioningPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Provisioning request body must be a JSON object.');
  }

  const record = value as Record<string, unknown>;
  const subscriptionId = stringValue(record.subscriptionId);
  if (!subscriptionId) {
    throw new Error('subscriptionId is required.');
  }

  return {
    subscriptionId,
    planId: stringValue(record.planId),
    planName: stringValue(record.planName),
    months: numberValue(record.months),
    amountKes: numberValue(record.amountKes),
    phone: stringValue(record.phone),
    customerName: stringValue(record.customerName),
    email: stringValue(record.email),
    mpesaReceipt: stringValue(record.mpesaReceipt),
    expiresAt: stringValue(record.expiresAt),
    requestedFormat: stringValue(record.requestedFormat) ?? 'xtream',
  };
}

export function getIptvProvisioningToken(): string | null {
  return (
    trimEnv(process.env.IPTV_PROVISIONING_TOKEN) ??
    trimEnv(process.env.ADMIN_SECRET) ??
    trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function isProvisioningRequestAuthorized(headerValue: string | null): boolean {
  const expectedToken = getIptvProvisioningToken();
  if (!expectedToken) {
    return false;
  }

  return tokensMatch(expectedToken, parseProvisioningToken(headerValue));
}

export function getInternalProvisioningUrl(origin?: string | null): string {
  return `${getProvisioningBaseUrl(origin)}/api/internal/iptv/provision`;
}

export function buildInternalCredentials(
  subscriptionId: string,
  origin?: string | null
): IptvCredentials {
  const username = `gsk_${randomSegment(8)}`;
  const password = `${randomSegment(6)}_${randomSegment(6)}`;
  const host = getProvisioningBaseUrl(origin);
  const port = host.startsWith('https://') ? 443 : 80;

  return {
    xtreamHost: host,
    xtreamPort: port,
    xtreamUsername: username,
    xtreamPassword: password,
    m3uUrl: `${host}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=ts`,
  };
}

export function assertIptvCredentials(value: unknown): IptvCredentials {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Provisioning response was empty');
  }

  const candidate = value as Record<string, unknown>;
  const xtreamHost =
    normalizeUrl(stringValue(candidate.xtreamHost)) ??
    normalizeUrl(stringValue(candidate.xtream_host)) ??
    normalizeUrl(stringValue(candidate.host)) ??
    normalizeUrl(stringValue(candidate.portal));
  const xtreamUsername =
    stringValue(candidate.xtreamUsername) ??
    stringValue(candidate.xtream_username) ??
    stringValue(candidate.username);
  const xtreamPassword =
    stringValue(candidate.xtreamPassword) ??
    stringValue(candidate.xtream_password) ??
    stringValue(candidate.password);

  if (!xtreamHost || !xtreamUsername || !xtreamPassword) {
    throw new Error('Provisioning response did not include Xtream credentials');
  }

  const xtreamPort =
    numberValue(candidate.xtreamPort) ??
    numberValue(candidate.xtream_port) ??
    numberValue(candidate.port) ??
    8080;
  const m3uUrl =
    stringValue(candidate.m3uUrl) ??
    stringValue(candidate.m3u_url) ??
    `${xtreamHost}/get.php?username=${encodeURIComponent(xtreamUsername)}&password=${encodeURIComponent(xtreamPassword)}&type=m3u_plus&output=ts`;

  return {
    xtreamHost,
    xtreamPort,
    xtreamUsername,
    xtreamPassword,
    m3uUrl,
  };
}

function getProviderAuthorizationHeader(): string | null {
  const token = trimEnv(process.env.IPTV_PROVIDER_API_TOKEN);
  if (!token) {
    return null;
  }

  const scheme = trimEnv(process.env.IPTV_PROVIDER_API_AUTH_SCHEME) ?? 'Bearer';
  return `${scheme} ${token}`;
}

export async function provisionFromConfiguredProviderApi(
  payload: IptvProvisioningPayload
): Promise<IptvCredentials | null> {
  const url = trimEnv(process.env.IPTV_PROVIDER_API_URL);
  if (!url) {
    return null;
  }

  const authorization = getProviderAuthorizationHeader();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Provider provisioning failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return assertIptvCredentials((data as { credentials?: unknown }).credentials ?? data);
}

export async function provisionInternalCredentials(
  payload: IptvProvisioningPayload,
  origin?: string | null
): Promise<{ credentials: IptvCredentials; source: 'provider_api' | 'internal_playlist' }> {
  const providerCredentials = await provisionFromConfiguredProviderApi(payload);
  if (providerCredentials) {
    return {
      credentials: providerCredentials,
      source: 'provider_api',
    };
  }

  return {
    credentials: buildInternalCredentials(payload.subscriptionId, origin),
    source: 'internal_playlist',
  };
}
