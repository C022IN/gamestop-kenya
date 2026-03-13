import { NextRequest, NextResponse } from 'next/server';
import { getAppUrl } from '@/lib/app-url';
import { createBillingLink } from '@/lib/billing-links';
import {
  IPTV_PLANS,
  type PlanId,
  activateSubscription,
  createPendingSubscription,
} from '@/lib/iptv-subscriptions';
import { provisionMemberFromSubscription } from '@/lib/movie-platform';
import { normaliseMpesaPhone } from '@/lib/mpesa';
import { getIptvStripeRecurring } from '@/lib/stripe/iptv';
import { getStripeServerClient } from '@/lib/stripe/server';
import {
  getStripeAutomaticTaxParams,
  getStripeProductTaxCode,
  getStripeTaxBehaviorValue,
  toStripeAmount,
} from '@/lib/stripe/tax';

export async function POST(req: NextRequest) {
  try {
    const { planId, customerName, email, phone } = (await req.json()) as {
      planId?: string;
      customerName?: string;
      email?: string;
      phone?: string;
    };

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

    if (plan.kesPrice <= 0) {
      const pending = await createPendingSubscription({
        planId: plan.id,
        customerName,
        email,
        phone: normalisedPhone,
        checkoutRequestId: `FREE-${Date.now()}`,
      });
      const subscription = await activateSubscription(pending.id, 'FREE-CHECKOUT');
      if (!subscription) {
        return NextResponse.json({ error: 'Could not activate free subscription.' }, { status: 500 });
      }

      const member = await provisionMemberFromSubscription(subscription);
      return NextResponse.json({
        kind: 'free',
        subscription,
        member: {
          profileId: member.profileId,
          accessCode: member.accessCode,
        },
      });
    }

    const stripe = getStripeServerClient();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Card payments are currently unavailable.' },
        { status: 503 }
      );
    }

    const appUrl = getAppUrl(req.nextUrl.origin);
    const customer = await stripe.customers.create({
      name: customerName,
      email,
      phone: normalisedPhone,
      metadata: {
        context: 'iptv_subscription',
        planId: plan.id,
        phone: normalisedPhone,
      },
    });
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${appUrl}/iptv/subscribe/${plan.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/iptv/subscribe/${plan.id}?canceled=1`,
      customer: customer.id,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      phone_number_collection: {
        enabled: true,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'kes',
            unit_amount: toStripeAmount(plan.kesPrice),
            recurring: getIptvStripeRecurring(plan),
            tax_behavior: getStripeTaxBehaviorValue(),
            product_data: {
              name: `GameStop Kenya IPTV ${plan.name}`,
              description: `${plan.name} recurring IPTV access`,
              ...(getStripeProductTaxCode('subscription')
                ? { tax_code: getStripeProductTaxCode('subscription') ?? undefined }
                : {}),
            },
          },
        },
      ],
      metadata: {
        context: 'iptv_subscription',
        planId: plan.id,
        customerName,
        email,
        phone: normalisedPhone,
      },
      payment_method_types: ['card'],
      ...getStripeAutomaticTaxParams(),
    });

    const subscription = await createPendingSubscription({
      planId: plan.id,
      customerName,
      email,
      phone: normalisedPhone,
      checkoutRequestId: session.id,
    });

    await createBillingLink({
      kind: 'iptv_subscription',
      recordId: subscription.id,
      stripeCustomerId: customer.id,
      stripeSessionId: session.id,
      metadata: {
        planId: plan.id,
        phone: normalisedPhone,
      },
    });

    return NextResponse.json({
      kind: 'stripe',
      url: session.url,
      sessionId: session.id,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error('Stripe IPTV checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe subscription checkout session.' },
      { status: 500 }
    );
  }
}
