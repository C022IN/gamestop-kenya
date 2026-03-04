import { NextRequest, NextResponse } from 'next/server';
import { IPTV_PLANS, PlanId, createPendingSubscription } from '@/lib/iptv-subscriptions';
import { initiateStkPush, normaliseMpesaPhone } from '@/lib/mpesa';

export async function POST(req: NextRequest) {
  try {
    const { planId, customerName, email, phone } = await req.json();

    if (!planId || !customerName || !email || !phone) {
      return NextResponse.json(
        { error: 'planId, customerName, email, and phone are required' },
        { status: 400 }
      );
    }

    const plan = IPTV_PLANS[planId as PlanId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    const normalisedPhone = normaliseMpesaPhone(String(phone));
    if (normalisedPhone.length !== 12) {
      return NextResponse.json(
        { error: 'Invalid Kenyan phone number. Use format 07XXXXXXXX or 254XXXXXXXXX' },
        { status: 400 }
      );
    }

    // Generate a reference for this IPTV order
    const orderRef = 'IPTV' + Date.now().toString().slice(-6);

    // Initiate M-Pesa STK push
    const result = await initiateStkPush({
      phone,
      amount: plan.kesPrice,
      orderId: orderRef,
      description: `GameStop Kenya IPTV ${plan.name} subscription`,
    });

    if (!result.success || !result.checkoutRequestId) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to initiate M-Pesa payment' },
        { status: 502 }
      );
    }

    // Create a pending subscription record
    const subscription = createPendingSubscription({
      planId: planId as PlanId,
      customerName,
      email,
      phone,
      checkoutRequestId: result.checkoutRequestId,
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      checkoutRequestId: result.checkoutRequestId,
      merchantRequestId: result.merchantRequestId,
      customerMessage: result.customerMessage,
      plan: {
        name: plan.name,
        amountKes: plan.kesPrice,
      },
    });
  } catch (err) {
    console.error('IPTV subscribe error:', err);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
