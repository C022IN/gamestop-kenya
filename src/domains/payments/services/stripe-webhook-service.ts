import Stripe from 'stripe';
import {
  claimBillingLinkInvoice,
  getBillingLinkByStripeSessionId,
  getBillingLinkByStripeSubscriptionId,
  updateBillingLink,
} from '@/lib/billing-links';
import {
  activateSubscription,
  extendSubscription,
  getSubscription,
} from '@/lib/iptv-subscriptions';
import { markStoreOrderPaid } from '@/lib/store-orders';
import { fromStripeAmount } from '@/lib/stripe/tax';

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

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const link = await getBillingLinkByStripeSessionId(session.id);
  if (!link) {
    return;
  }

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
      provider: session.payment_status === 'no_payment_required' ? 'free' : 'stripe',
      providerReference: session.id,
      totalKes: fromStripeAmount(session.amount_total),
      taxKes: fromStripeAmount(session.total_details?.amount_tax),
    });
    return;
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
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
  if (!stripeSubscriptionId || invoice.billing_reason === 'subscription_create') {
    return;
  }

  const link = await getBillingLinkByStripeSubscriptionId(stripeSubscriptionId);
  if (!link || link.kind !== 'iptv_subscription') {
    return;
  }

  const claim = await claimBillingLinkInvoice(link.id, invoice.id);
  if (!claim.claimed) {
    return;
  }

  const existing = await getSubscription(link.recordId);
  if (!existing || existing.status !== 'active') {
    return;
  }

  await extendSubscription(link.recordId, invoice.id);
}

async function recordInvoiceMetadataFailure(
  invoice: Stripe.Invoice,
  metadata: Record<string, string>
) {
  const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
  if (!stripeSubscriptionId) {
    return;
  }

  const link = await getBillingLinkByStripeSubscriptionId(stripeSubscriptionId);
  if (!link || link.kind !== 'iptv_subscription') {
    return;
  }

  await updateBillingLink(link.id, { metadata });
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await recordInvoiceMetadataFailure(event.data.object as Stripe.Invoice, {
        lastStripeFailedInvoiceId: (event.data.object as Stripe.Invoice).id,
        lastStripePaymentFailedAt: new Date().toISOString(),
      });
      break;

    case 'invoice.finalization_failed':
      await recordInvoiceMetadataFailure(event.data.object as Stripe.Invoice, {
        lastStripeFinalizationFailedInvoiceId: (event.data.object as Stripe.Invoice).id,
        lastStripeFinalizationFailedAt: new Date().toISOString(),
      });
      break;

    default:
      break;
  }
}
