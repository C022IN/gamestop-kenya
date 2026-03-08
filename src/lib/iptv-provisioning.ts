import type { IptvCredentials, IptvSubscription } from '@/lib/iptv-subscriptions';

function getSiteHost(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gamestopkenya.com';
}

function buildLocalCredentials(subscriptionId: string): IptvCredentials {
  const rand = (len: number) => Math.random().toString(36).slice(2, 2 + len).toLowerCase();
  const username = 'gsk_' + rand(8);
  const password = rand(6) + '_' + rand(6);
  const host = getSiteHost();

  return {
    xtreamHost: host,
    xtreamPort: 8080,
    xtreamUsername: username,
    xtreamPassword: password,
    m3uUrl: `${host}/api/iptv/stream/${subscriptionId}/playlist.m3u`,
  };
}

function assertCredentials(value: unknown): IptvCredentials {
  if (!value || typeof value !== 'object') {
    throw new Error('Provisioning response was empty');
  }

  const candidate = value as Partial<IptvCredentials>;
  if (
    !candidate.xtreamHost ||
    !candidate.xtreamUsername ||
    !candidate.xtreamPassword
  ) {
    throw new Error('Provisioning response did not include Xtream credentials');
  }

  const xtreamPort =
    typeof candidate.xtreamPort === 'number' && Number.isFinite(candidate.xtreamPort)
      ? candidate.xtreamPort
      : 8080;

  const m3uUrl =
    candidate.m3uUrl ??
    `${candidate.xtreamHost.replace(/\/+$/, '')}/get.php?username=${encodeURIComponent(candidate.xtreamUsername)}&password=${encodeURIComponent(candidate.xtreamPassword)}&type=m3u_plus&output=ts`;

  return {
    xtreamHost: candidate.xtreamHost,
    xtreamPort,
    xtreamUsername: candidate.xtreamUsername,
    xtreamPassword: candidate.xtreamPassword,
    m3uUrl,
  };
}

async function provisionViaWebhook(subscription: IptvSubscription): Promise<IptvCredentials> {
  const url = process.env.IPTV_PROVISIONING_URL;
  if (!url) {
    throw new Error('IPTV_PROVISIONING_URL is required when webhook provisioning is enabled');
  }

  const token = process.env.IPTV_PROVISIONING_TOKEN;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
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
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Provisioning webhook failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return assertCredentials(data.credentials ?? data);
}

export async function provisionCredentials(subscription: IptvSubscription): Promise<IptvCredentials> {
  const mode = process.env.IPTV_PROVISIONING_MODE ?? 'local';

  if (mode === 'webhook') {
    return provisionViaWebhook(subscription);
  }

  return buildLocalCredentials(subscription.id);
}
