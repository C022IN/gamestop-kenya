import { formatPlaylist, getPlaylistEntries } from '@/lib/iptv-catalog';
import { getSubscription } from '@/lib/iptv-subscriptions';

type ServiceError = { ok: false; error: string; status: number };
type ServiceSuccess<T> = { ok: true; data: T };
type ServiceResult<T> = ServiceError | ServiceSuccess<T>;

export interface PlaylistResult {
  content: string;
  subscriptionId: string;
}

export async function getSubscriptionPlaylist(params: {
  subscriptionId: string;
  username: string;
  password: string;
}): Promise<ServiceResult<PlaylistResult>> {
  const { subscriptionId, username, password } = params;

  const subscription = await getSubscription(subscriptionId);
  if (!subscription || subscription.status !== 'active') {
    return { ok: false, error: 'Subscription not found', status: 404 };
  }

  if (
    subscription.credentials?.xtreamUsername !== username ||
    subscription.credentials?.xtreamPassword !== password
  ) {
    return { ok: false, error: 'Invalid playlist credentials', status: 401 };
  }

  if (new Date(subscription.expiresAt).getTime() <= Date.now()) {
    return { ok: false, error: 'Subscription has expired', status: 403 };
  }

  const content = formatPlaylist(await getPlaylistEntries());

  return { ok: true, data: { content, subscriptionId } };
}
