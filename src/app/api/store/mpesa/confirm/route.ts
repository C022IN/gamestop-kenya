import { NextRequest, NextResponse } from 'next/server';
import { getPaymentResult, setPaymentResult } from '@/lib/mpesa-payment-results';
import { queryStkStatus } from '@/lib/mpesa';
import {
  getStoreOrderByProviderReference,
  markStoreOrderPaid,
} from '@/lib/store-orders';

export async function POST(req: NextRequest) {
  try {
    const { checkoutRequestId } = (await req.json()) as { checkoutRequestId?: string };

    if (!checkoutRequestId) {
      return NextResponse.json({ error: 'checkoutRequestId is required' }, { status: 400 });
    }

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

    if (!payment) {
      return NextResponse.json({ error: 'Payment not yet confirmed.' }, { status: 402 });
    }

    if (payment.status !== 'success') {
      return NextResponse.json(
        { error: payment.resultDesc ?? 'Payment failed.' },
        { status: 402 }
      );
    }

    const existing = await getStoreOrderByProviderReference('mpesa', checkoutRequestId);
    if (!existing) {
      return NextResponse.json({ error: 'Order record not found.' }, { status: 404 });
    }

    const order =
      existing.paymentStatus === 'paid'
        ? existing
        : await markStoreOrderPaid({
            orderId: existing.id,
            provider: 'mpesa',
            providerReference: checkoutRequestId,
          });

    if (!order) {
      return NextResponse.json({ error: 'Could not confirm order.' }, { status: 500 });
    }

    return NextResponse.json({
      order,
      receiptNumber: payment.mpesaReceiptNumber,
      amount: payment.amount,
    });
  } catch (error) {
    console.error('Store M-Pesa confirm error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm M-Pesa order.' },
      { status: 500 }
    );
  }
}
