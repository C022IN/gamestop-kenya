import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  claimBillingLinkInvoice,
  getBillingLinkByStripeSessionId,
  getBillingLinkByStripeSubscriptionId,
  updateBillingLink,
} from '@/lib/billing-links';
import { extendSubscription, getSubscription, activateSubscription } from '@/lib/iptv-subscriptions';
import { getStripeWebhookSecret } from '@/lib/stripe/env';
import { getStripeServerClient } from '@/lib/stripe/server';
import { fromStripeAmount } from '@/lib/stripe/tax';
import { markStoreOrderPaid } from '@/lib/store-orders';

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const invoiceSubscription =
    invoice.parent?.type === 'subscription_details'
      ? invoice.parent.subscription_details?.subscription
      : null;

  if (!invoiceSubscription) {
    return null;
  }

  return typeof invoiceSubscription === 'string'
    ? invoiceSubscription
    : invoiceSubscription.id;
}

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
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const link = await getBillingLinkByStripeSessionId(session.id);
        if (!link) break;

        if (link.kind === 'store_order') {
          const stripeCustomerId =
            typeof session.customer === 'string' ? session.customer : session.customer?.id;
          if (stripeCustomerId && stripeCustomerId !== link.stripeCustomerId) {
            await updateBillingLink(link.id, {
              stripeSessionId: session.id,
              stripeCustomerId,
            });
          }

          await markStoreOrderPaid({
            orderId: link.recordId,
            provider:
              session.payment_status === 'no_payment_required' ? 'free' : 'stripe',
            providerReference: session.id,
            totalKes: fromStripeAmount(session.amount_total),
            taxKes: fromStripeAmount(session.total_details?.amount_tax),
          });
        }

        if (link.kind === 'iptv_subscription') {
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
          if (existing && existing.status !== 'active') {
            await activateSubscription(existing.id, `STRIPE-${session.id}`);
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);

        if (!stripeSubscriptionId) break;
        if (invoice.billing_reason === 'subscription_create') break;

        const link = await getBillingLinkByStripeSubscriptionId(stripeSubscriptionId);
        if (!link || link.kind !== 'iptv_subscription') break;

        const claim = await claimBillingLinkInvoice(link.id, invoice.id);
        if (!claim.claimed) break;

        const existing = await getSubscription(link.recordId);
        if (!existing || existing.status !== 'active') break;

        await extendSubscription(link.recordId, invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
        if (!stripeSubscriptionId) break;

        const link = await getBillingLinkByStripeSubscriptionId(stripeSubscriptionId);
        if (!link || link.kind !== 'iptv_subscription') break;

        await updateBillingLink(link.id, {
          metadata: {
            lastStripeFailedInvoiceId: invoice.id,
            lastStripePaymentFailedAt: new Date().toISOString(),
          },
        });
        break;
      }

      case 'invoice.finalization_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
        if (!stripeSubscriptionId) break;

        const link = await getBillingLinkByStripeSubscriptionId(stripeSubscriptionId);
        if (!link || link.kind !== 'iptv_subscription') break;

        await updateBillingLink(link.id, {
          metadata: {
            lastStripeFinalizationFailedInvoiceId: invoice.id,
            lastStripeFinalizationFailedAt: new Date().toISOString(),
          },
        });
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 });
  }
}
