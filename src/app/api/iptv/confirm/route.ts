import { NextRequest, NextResponse } from 'next/server';
import { paymentResults } from '@/lib/mpesa-payment-results';
import { queryStkStatus } from '@/lib/mpesa';
import { activateByCheckoutId, getSubscriptionByCheckout } from '@/lib/iptv-subscriptions';
import {
  createMovieSession,
  MOVIE_SESSION_COOKIE,
  provisionMemberFromSubscription,
} from '@/lib/movie-platform';

/**
 * Called by the client after polling confirms the M-Pesa payment succeeded.
 * Activates the subscription and returns the generated credentials.
 */
export async function POST(req: NextRequest) {
  try {
    const { checkoutRequestId } = await req.json();

    if (!checkoutRequestId) {
      return NextResponse.json({ error: 'checkoutRequestId is required' }, { status: 400 });
    }

    // Verify the payment actually succeeded in our store
    let payment = paymentResults.get(checkoutRequestId);
    if (!payment) {
      const queried = await queryStkStatus(checkoutRequestId);
      if (queried.status === 'success' || queried.status === 'failed') {
        paymentResults.set(checkoutRequestId, {
          status: queried.status,
          resultCode: queried.resultCode ?? '',
          resultDesc: queried.resultDesc ?? '',
        });
        payment = paymentResults.get(checkoutRequestId);
      }
    }

    if (!payment) {
      return NextResponse.json({ error: 'Payment not yet confirmed' }, { status: 402 });
    }

    if (payment.status !== 'success') {
      return NextResponse.json({ error: payment.resultDesc ?? 'Payment failed' }, { status: 402 });
    }

    // Check if already activated
    const existing = getSubscriptionByCheckout(checkoutRequestId);
    if (existing?.status === 'active') {
      const member = provisionMemberFromSubscription(existing);
      const session = createMovieSession(member.profileId);
      const response = NextResponse.json({
        subscription: existing,
        member: {
          profileId: member.profileId,
          accessCode: member.accessCode,
        },
      });

      if (session) {
        response.cookies.set(MOVIE_SESSION_COOKIE, session.token, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          expires: new Date(session.expiresAt),
        });
      }

      return response;
    }

    // Activate and provision credentials
    const subscription = await activateByCheckoutId(checkoutRequestId, payment.mpesaReceiptNumber ?? '');
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription record not found' }, { status: 404 });
    }

    const member = provisionMemberFromSubscription(subscription);
    const session = createMovieSession(member.profileId);
    const response = NextResponse.json({
      subscription,
      member: {
        profileId: member.profileId,
        accessCode: member.accessCode,
      },
    });

    if (session) {
      response.cookies.set(MOVIE_SESSION_COOKIE, session.token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        expires: new Date(session.expiresAt),
      });
    }

    return response;
  } catch (err) {
    console.error('IPTV confirm error:', err);
    const message =
      err instanceof Error && err.message
        ? `Credentials provisioning failed. ${err.message}`
        : 'Credentials provisioning failed. Please contact support.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
