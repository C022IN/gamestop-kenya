import type Stripe from 'stripe';
import {
  getStripeDigitalTaxCode,
  getStripePhysicalTaxCode,
  getStripeShippingTaxCode,
  getStripeSubscriptionTaxCode,
  getStripeTaxBehavior,
  isStripeAutomaticTaxEnabled,
} from '@/lib/stripe/env';

type CheckoutPriceData = Stripe.Checkout.SessionCreateParams.LineItem.PriceData;
type CheckoutTaxBehavior = CheckoutPriceData['tax_behavior'];

export function toStripeAmount(amount: number) {
  return Math.round(amount * 100);
}

export function fromStripeAmount(amount: number | null | undefined) {
  return Math.round((amount ?? 0) / 100);
}

export function getStripeAutomaticTaxParams(): Pick<
  Stripe.Checkout.SessionCreateParams,
  'automatic_tax' | 'tax_id_collection'
> {
  if (!isStripeAutomaticTaxEnabled()) {
    return {};
  }

  return {
    automatic_tax: { enabled: true },
    tax_id_collection: {
      enabled: true,
      required: 'if_supported',
    },
  };
}

export function getStripeTaxBehaviorValue(): CheckoutTaxBehavior {
  return getStripeTaxBehavior();
}

export function getStripeProductTaxCode(kind: 'physical' | 'digital' | 'subscription') {
  if (kind === 'digital') return getStripeDigitalTaxCode();
  if (kind === 'subscription') return getStripeSubscriptionTaxCode();
  return getStripePhysicalTaxCode();
}

export function getStripeShippingTaxCodeValue() {
  return getStripeShippingTaxCode();
}
