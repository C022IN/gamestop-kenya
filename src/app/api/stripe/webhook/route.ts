import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleStripeWebhookEvent } from '@/domains/payments/services/stripe-webhook-service';
import { getStripeWebhookSecret } from '@/lib/stripe/env';
import { getStripeServerClient } from '@/lib/stripe/server';

export async function POST(req: NextRequest) {
  const stripe = getStripeServerClient();
  const webhookSecret = getStripeWebhookSecret();

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook is not configured.' },
      { status: 503 }
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature error:', error);
    return NextResponse.json({ error: 'Invalid Stripe signature.' }, { status: 400 });
  }

  try {
    await handleStripeWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 });
  }
}
