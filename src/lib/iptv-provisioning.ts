import type { IptvCredentials, IptvSubscription } from '@/lib/iptv-subscriptions';
import {
  assertIptvCredentials,
  buildInternalCredentials,
  buildProvisioningPayload,
  getInternalProvisioningUrl,
  getIptvProvisioningToken,
} from '@/lib/iptv-provisioning-core';

async function provisionViaWebhook(subscription: IptvSubscription): Promise<IptvCredentials> {
  const url = process.env.IPTV_PROVISIONING_URL?.trim() || getInternalProvisioningUrl();
  const token = getIptvProvisioningToken();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(buildProvisioningPayload(subscription)),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Provisioning webhook failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return assertIptvCredentials((data as { credentials?: unknown }).credentials ?? data);
}

export async function provisionCredentials(subscription: IptvSubscription): Promise<IptvCredentials> {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  const requiresWebhookProvisioning = vercelEnv
    ? vercelEnv === 'production'
    : process.env.NODE_ENV === 'production';
  const mode =
    process.env.IPTV_PROVISIONING_MODE ??
    (requiresWebhookProvisioning ? 'webhook' : 'local');

  if (requiresWebhookProvisioning && mode !== 'webhook') {
    throw new Error('Production requires IPTV_PROVISIONING_MODE=webhook.');
  }

  if (mode === 'webhook') {
    return provisionViaWebhook(subscription);
  }

  return buildInternalCredentials(subscription.id);
}
