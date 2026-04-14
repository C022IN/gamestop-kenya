import {
  activateSubscription,
  assignSubscriptionToAdmin,
  createPendingSubscription,
  getLatestSubscriptionForPhone,
  getSubscription,
  hasSubscriptionPlaybackAccess,
  IPTV_PLANS,
  reprovisionSubscriptionCredentials,
  type IptvSubscription,
  type PlanId,
} from '@/lib/iptv-subscriptions';
import { getAdminById } from '@/lib/admin-auth';
import { normaliseMpesaPhone } from '@/lib/mpesa';
import { provisionMemberFromSubscription } from '@/lib/movie-platform';

// Re-export types and constants that routes need
export { IPTV_PLANS, type PlanId, type IptvSubscription };

type ServiceError = { ok: false; error: string; status: number };
type ServiceSuccess<T> = { ok: true; data: T };
type ServiceResult<T> = ServiceError | ServiceSuccess<T>;

// ---------------------------------------------------------------------------
// Grant — admin manually creates and activates a subscription for a phone
// ---------------------------------------------------------------------------

export async function grantIptvSubscription(params: {
  phone: string;
  customerName?: string;
  planId: PlanId;
  mpesaReceipt?: string;
  actingAdminId: string;
}): Promise<
  ServiceResult<{
    subscription: IptvSubscription;
    member: { profileId: string; accessCode: string; phone: string };
    reusedExistingMember: boolean;
  }>
> {
  const { phone: rawPhone, customerName, planId, mpesaReceipt, actingAdminId } = params;

  if (!IPTV_PLANS[planId]) {
    return { ok: false, error: `Unknown plan: ${planId}`, status: 400 };
  }

  const phone = normaliseMpesaPhone(rawPhone);
  const existing = await getLatestSubscriptionForPhone(phone);
  const resolvedCustomerName = customerName?.trim() || existing?.customerName?.trim() || '';

  if (!resolvedCustomerName) {
    return {
      ok: false,
      error:
        'customerName is required for a new user. Existing users can be renewed by phone only.',
      status: 400,
    };
  }

  const receipt = mpesaReceipt?.trim() || `ADMIN-GRANT-${Date.now()}`;
  const checkoutRequestId = `ADMIN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const assignedAdminId = existing?.assignedAdminId ?? actingAdminId;
  const resolvedEmail = existing?.email?.trim() || `${phone}@admin.grant`;
  const isRenewal = Boolean(existing);

  const pending = await createPendingSubscription({
    planId,
    customerName: resolvedCustomerName,
    email: resolvedEmail,
    phone,
    checkoutRequestId,
    assignedAdminId,
    assignedByAdminId: actingAdminId,
  });

  const activated = await activateSubscription(pending.id, receipt, {
    assignedAdminId,
    assignedByAdminId: actingAdminId,
  });

  if (!activated) {
    return { ok: false, error: 'Activation failed.', status: 500 };
  }

  const member = await provisionMemberFromSubscription(activated);

  return {
    ok: true,
    data: {
      subscription: activated,
      member: { profileId: member.profileId, accessCode: member.accessCode, phone },
      reusedExistingMember: isRenewal,
    },
  };
}

// ---------------------------------------------------------------------------
// Activate — admin activates an existing pending subscription record
// ---------------------------------------------------------------------------

export async function activateIptvSubscription(params: {
  subscriptionId: string;
  mpesaReceipt?: string;
  assignedAdminId?: string;
  actingAdminId: string;
  isSuperAdmin: boolean;
}): Promise<
  ServiceResult<{
    subscription: IptvSubscription;
    alreadyActive: boolean;
  }>
> {
  const { subscriptionId, mpesaReceipt = 'MANUAL', actingAdminId, isSuperAdmin: canSeeAll } =
    params;

  const existing = await getSubscription(subscriptionId);
  if (!existing) {
    return { ok: false, error: 'Subscription not found', status: 404 };
  }

  if (!canSeeAll && existing.assignedAdminId !== actingAdminId) {
    return { ok: false, error: 'You can only activate users assigned to you.', status: 403 };
  }

  const nextAssignedAdminId = canSeeAll
    ? params.assignedAdminId || existing.assignedAdminId
    : actingAdminId;

  if (!(await getAdminById(nextAssignedAdminId))) {
    return { ok: false, error: 'Assigned admin was not found.', status: 400 };
  }

  if (existing.status === 'active') {
    return { ok: true, data: { subscription: existing, alreadyActive: true } };
  }

  const activated = await activateSubscription(subscriptionId, mpesaReceipt, {
    assignedAdminId: nextAssignedAdminId,
    assignedByAdminId: actingAdminId,
  });

  if (activated) {
    await provisionMemberFromSubscription(activated);
  }

  return {
    ok: true,
    data: { subscription: activated ?? existing, alreadyActive: false },
  };
}

// ---------------------------------------------------------------------------
// Assign — super admin reassigns a subscription to a different admin
// ---------------------------------------------------------------------------

export async function assignIptvSubscription(params: {
  subscriptionId: string;
  targetAdminId: string;
  actingAdminId: string;
}): Promise<
  ServiceResult<{
    subscription: IptvSubscription;
    assignedAdmin: Awaited<ReturnType<typeof getAdminById>>;
  }>
> {
  const { subscriptionId, targetAdminId, actingAdminId } = params;

  if (!(await getSubscription(subscriptionId))) {
    return { ok: false, error: 'Subscription not found', status: 404 };
  }

  const targetAdmin = await getAdminById(targetAdminId);
  if (!targetAdmin) {
    return { ok: false, error: 'Admin not found', status: 404 };
  }

  const updated = await assignSubscriptionToAdmin(subscriptionId, targetAdminId, actingAdminId);
  if (!updated) {
    return { ok: false, error: 'Subscription could not be reassigned.', status: 500 };
  }

  return { ok: true, data: { subscription: updated, assignedAdmin: targetAdmin } };
}

// ---------------------------------------------------------------------------
// Reprovision — refresh IPTV credentials for an active subscription
// ---------------------------------------------------------------------------

export async function reprovisionIptvSubscription(params: {
  subscriptionId: string;
  actingAdminId: string;
  isSuperAdmin: boolean;
}): Promise<ServiceResult<{ subscription: IptvSubscription }>> {
  const { subscriptionId, actingAdminId, isSuperAdmin: canManageAll } = params;

  const existing = await getSubscription(subscriptionId, { fresh: true });
  if (!existing) {
    return { ok: false, error: 'Subscription not found.', status: 404 };
  }

  const canManage = canManageAll || existing.assignedAdminId === actingAdminId;
  if (!canManage) {
    return {
      ok: false,
      error: 'You can only reprovision users assigned to you.',
      status: 403,
    };
  }

  if (!hasSubscriptionPlaybackAccess(existing)) {
    return {
      ok: false,
      error: 'Only active subscriptions can be reprovisioned.',
      status: 400,
    };
  }

  const updated = await reprovisionSubscriptionCredentials(subscriptionId);
  if (!updated) {
    return { ok: false, error: 'Subscription could not be reprovisioned.', status: 500 };
  }

  return { ok: true, data: { subscription: updated } };
}
