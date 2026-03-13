import { NextRequest, NextResponse } from 'next/server';
import { getBillingLinkByStripeSessionId, updateBillingLink } from '@/lib/billing-links';
import { getStripeServerClient } from '@/lib/stripe/server';
import { fromStripeAmount } from '@/lib/stripe/tax';
import { getStoreOrderById, markStoreOrderPaid } from '@/lib/store-orders';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const stripe = getStripeServerClient();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Card payments are currently unavailable.' },
        { status: 503 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const link = await getBillingLinkByStripeSessionId(session.id);

    if (!link || link.kind !== 'store_order') {
      return NextResponse.json({ error: 'Store order not found for this session.' }, { status: 404 });
    }

    const stripeCustomerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id;
    if (stripeCustomerId && stripeCustomerId !== link.stripeCustomerId) {
      await updateBillingLink(link.id, {
        stripeSessionId: session.id,
        stripeCustomerId,
      });
    }

    const isPaid =
      session.payment_status === 'paid' ||
      session.payment_status === 'no_payment_required';
    const totalKes = fromStripeAmount(session.amount_total);
    const taxKes = fromStripeAmount(session.total_details?.amount_tax);

    const order = isPaid
      ? await markStoreOrderPaid({
          orderId: link.recordId,
          provider: session.payment_status === 'no_payment_required' ? 'free' : 'stripe',
          providerReference: session.id,
          totalKes,
          taxKes,
        })
      : await getStoreOrderById(link.recordId);

    if (!order) {
      return NextResponse.json({ error: 'Order record not found.' }, { status: 404 });
    }

    return NextResponse.json({
      status: isPaid ? 'complete' : session.status,
      paymentStatus: session.payment_status,
      order,
    });
  } catch (error) {
    console.error('Stripe store session lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to verify Stripe checkout session.' },
      { status: 500 }
    );
  }
}
