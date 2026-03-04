import { NextRequest, NextResponse } from 'next/server';
import { paymentResults } from '@/lib/mpesa-payment-results';
import { activateByCheckoutId, getSubscriptionByCheckout } from '@/lib/iptv-subscriptions';

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
    const payment = paymentResults.get(checkoutRequestId);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not yet confirmed' }, { status: 402 });
    }

    if (payment.status !== 'success') {
      return NextResponse.json({ error: payment.resultDesc ?? 'Payment failed' }, { status: 402 });
    }

    // Check if already activated
    const existing = getSubscriptionByCheckout(checkoutRequestId);
    if (existing?.status === 'active') {
      return NextResponse.json({ subscription: existing });
    }

    // Activate and provision credentials
    const subscription = activateByCheckoutId(checkoutRequestId, payment.mpesaReceiptNumber ?? '');
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription record not found' }, { status: 404 });
    }

    return NextResponse.json({ subscription });
  } catch (err) {
    console.error('IPTV confirm error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
