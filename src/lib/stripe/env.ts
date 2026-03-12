function trimEnv(value: string | undefined): string | null {
  const next = value?.trim();
  return next ? next : null;
}

function readBooleanEnv(value: string | undefined, fallback: boolean) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return fallback;
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export function getStripeSecretKey(): string | null {
  return trimEnv(process.env.STRIPE_SECRET_KEY);
}

export function getStripeWebhookSecret(): string | null {
  return trimEnv(process.env.STRIPE_WEBHOOK_SECRET);
}

export function getStripePublishableKey(): string | null {
  return trimEnv(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

export function hasStripeServerEnv(): boolean {
  return Boolean(getStripeSecretKey());
}

export function hasStripeWebhookEnv(): boolean {
  return Boolean(getStripeSecretKey() && getStripeWebhookSecret());
}

export function isStripeAutomaticTaxEnabled(): boolean {
  return readBooleanEnv(process.env.STRIPE_AUTOMATIC_TAX_ENABLED, true);
}

export function getStripeTaxBehavior(): 'exclusive' | 'inclusive' | 'unspecified' {
  const value = trimEnv(process.env.STRIPE_TAX_BEHAVIOR)?.toLowerCase();
  if (value === 'inclusive' || value === 'exclusive' || value === 'unspecified') {
    return value;
  }

  return 'exclusive';
}

export function getStripePhysicalTaxCode(): string | null {
  return trimEnv(process.env.STRIPE_PHYSICAL_TAX_CODE);
}

export function getStripeDigitalTaxCode(): string | null {
  return trimEnv(process.env.STRIPE_DIGITAL_TAX_CODE);
}

export function getStripeSubscriptionTaxCode(): string | null {
  return trimEnv(process.env.STRIPE_SUBSCRIPTION_TAX_CODE);
}

export function getStripeShippingTaxCode(): string | null {
  return trimEnv(process.env.STRIPE_SHIPPING_TAX_CODE) ?? 'txcd_92010001';
}
