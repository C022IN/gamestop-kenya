import { NextRequest, NextResponse } from 'next/server';
import {
  createMovieSession,
  MOVIE_SESSION_COOKIE,
  provisionMemberFromSubscription,
} from '@/lib/movie-platform';
import { getBillingLinkByStripeSessionId, updateBillingLink } from '@/lib/billing-links';
import { getStripeServerClient } from '@/lib/stripe/server';
import { fromStripeAmount } from '@/lib/stripe/tax';
import { activateSubscription, getSubscription } from '@/lib/iptv-subscriptions';

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const stripe = getStripeServerClient();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured on the server.' },
        { status: 503 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });
    const link = await getBillingLinkByStripeSessionId(session.id);

    if (!link || link.kind !== 'iptv_subscription') {
      return NextResponse.json({ error: 'Subscription record not found.' }, { status: 404 });
    }

    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;
    const stripeCustomerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id;

    await updateBillingLink(link.id, {
      stripeSessionId: session.id,
      stripeCustomerId,
      stripeSubscriptionId,
    });

    const existing = await getSubscription(link.recordId);
    if (!existing) {
      return NextResponse.json({ error: 'Subscription record not found.' }, { status: 404 });
    }

    const isPaid =
      session.payment_status === 'paid' ||
      session.payment_status === 'no_payment_required';

    if (!isPaid) {
      return NextResponse.json(
        { error: 'Payment is not complete yet.', status: session.payment_status },
        { status: 402 }
      );
    }

    const subscription =
      existing.status === 'active'
        ? existing
        : await activateSubscription(existing.id, `STRIPE-${session.id}`);

    if (!subscription) {
      return NextResponse.json({ error: 'Could not activate subscription.' }, { status: 500 });
    }

    const member = await provisionMemberFromSubscription(subscription);
    const movieSession = await createMovieSession(member.profileId);
    const taxKes = fromStripeAmount(session.total_details?.amount_tax);
    const chargedKes = fromStripeAmount(session.amount_total);
    const response = NextResponse.json({
      status: 'complete',
      subscription,
      billing: {
        currency: (session.currency ?? 'kes').toUpperCase(),
        taxKes,
        chargedKes,
      },
      member: {
        profileId: member.profileId,
        accessCode: member.accessCode,
      },
    });

    if (movieSession) {
      response.cookies.set(MOVIE_SESSION_COOKIE, movieSession.token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        expires: new Date(movieSession.expiresAt),
      });
    }

    return response;
  } catch (error) {
    console.error('Stripe IPTV session lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to verify Stripe subscription checkout session.' },
      { status: 500 }
    );
  }
}
