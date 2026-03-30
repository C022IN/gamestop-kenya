import {
  activateByCheckoutId,
  createPendingSubscription,
  getSubscriptionByCheckout,
  IPTV_PLANS,
  type IptvSubscription,
  type PlanId,
} from '@/lib/iptv-subscriptions';
import { createMovieSession, provisionMemberFromSubscription } from '@/lib/movie-platform';
import { initiateStkPush, normaliseMpesaPhone, queryStkStatus } from '@/lib/mpesa';
import { getPaymentResult, setPaymentResult } from '@/lib/mpesa-payment-results';

type CheckoutError = {
  ok: false;
  error: string;
  status: number;
};

type CheckoutSuccess<T> = {
  ok: true;
  data: T;
};

type CheckoutResult<T> = CheckoutError | CheckoutSuccess<T>;

type CheckoutMember = {
  profileId: string;
  accessCode: string;
};

type MovieSessionResult = {
  token: string;
  expiresAt: string;
} | null;

function makeOrderReference() {
  return 'IPTV' + Date.now().toString().slice(-6);
}

export async function startMpesaIptvCheckout(params: {
  planId: string;
  customerName: string;
  email: string;
  phone: string;
}): Promise<
  CheckoutResult<{
    subscriptionId: string;
    checkoutRequestId: string;
    merchantRequestId: string | undefined;
    customerMessage: string | undefined;
    plan: {
      name: string;
      amountKes: number;
    };
  }>
> {
  try {
    const { planId, customerName, email, phone } = params;

    if (!planId || !customerName || !email || !phone) {
      return {
        ok: false,
        error: 'planId, customerName, email, and phone are required',
        status: 400,
      };
    }

    const plan = IPTV_PLANS[planId as PlanId];
    if (!plan) {
      return { ok: false, error: 'Invalid plan ID', status: 400 };
    }

    const normalisedPhone = normaliseMpesaPhone(String(phone));
    if (normalisedPhone.length !== 12) {
      return {
        ok: false,
        error: 'Invalid Kenyan phone number. Use format 07XXXXXXXX or 254XXXXXXXXX',
        status: 400,
      };
    }

    const orderRef = makeOrderReference();
    const result = await initiateStkPush({
      phone,
      amount: plan.kesPrice,
      orderId: orderRef,
      description: `GameStop Kenya IPTV ${plan.name} subscription`,
    });

    if (!result.success || !result.checkoutRequestId) {
      return {
        ok: false,
        error: result.error ?? 'Failed to initiate M-Pesa payment',
        status: 502,
      };
    }

    const subscription = await createPendingSubscription({
      planId: planId as PlanId,
      customerName,
      email,
      phone: normalisedPhone,
      checkoutRequestId: result.checkoutRequestId,
    });

    return {
      ok: true,
      data: {
        subscriptionId: subscription.id,
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        customerMessage: result.customerMessage,
        plan: {
          name: plan.name,
          amountKes: plan.kesPrice,
        },
      },
    };
  } catch (error) {
    console.error('IPTV subscribe error:', error);
    return {
      ok: false,
      error: 'Internal server error. Please try again.',
      status: 500,
    };
  }
}

async function resolvePaymentResult(checkoutRequestId: string) {
  let payment = await getPaymentResult(checkoutRequestId);

  if (!payment) {
    const queried = await queryStkStatus(checkoutRequestId);
    if (queried.status === 'success' || queried.status === 'failed') {
      await setPaymentResult(checkoutRequestId, {
        status: queried.status,
        resultCode: queried.resultCode ?? '',
        resultDesc: queried.resultDesc ?? '',
      });
      payment = await getPaymentResult(checkoutRequestId);
    }
  }

  return payment;
}

async function buildMemberAccess(
  subscription: IptvSubscription
): Promise<{ member: CheckoutMember; movieSession: MovieSessionResult }> {
  const member = await provisionMemberFromSubscription(subscription);
  const session = await createMovieSession(member.profileId);

  return {
    member: {
      profileId: member.profileId,
      accessCode: member.accessCode,
    },
    movieSession: session
      ? {
          token: session.token,
          expiresAt: session.expiresAt,
        }
      : null,
  };
}

export async function confirmMpesaIptvCheckout(
  checkoutRequestId: string
): Promise<
  CheckoutResult<{
    subscription: IptvSubscription;
    member: CheckoutMember;
    movieSession: MovieSessionResult;
  }>
> {
  try {
    if (!checkoutRequestId) {
      return {
        ok: false,
        error: 'checkoutRequestId is required',
        status: 400,
      };
    }

    const payment = await resolvePaymentResult(checkoutRequestId);

    if (!payment) {
      return { ok: false, error: 'Payment not yet confirmed', status: 402 };
    }

    if (payment.status !== 'success') {
      return {
        ok: false,
        error: payment.resultDesc ?? 'Payment failed',
        status: 402,
      };
    }

    const existing = await getSubscriptionByCheckout(checkoutRequestId);
    if (existing?.status === 'active') {
      const access = await buildMemberAccess(existing);
      return {
        ok: true,
        data: {
          subscription: existing,
          ...access,
        },
      };
    }

    const subscription = await activateByCheckoutId(
      checkoutRequestId,
      payment.mpesaReceiptNumber ?? ''
    );

    if (!subscription) {
      return {
        ok: false,
        error: 'Subscription record not found',
        status: 404,
      };
    }

    const access = await buildMemberAccess(subscription);
    return {
      ok: true,
      data: {
        subscription,
        ...access,
      },
    };
  } catch (error) {
    console.error('IPTV confirm error:', error);
    return {
      ok: false,
      error:
        error instanceof Error && error.message
          ? `Credentials provisioning failed. ${error.message}`
          : 'Credentials provisioning failed. Please contact support.',
      status: 500,
    };
  }
}
