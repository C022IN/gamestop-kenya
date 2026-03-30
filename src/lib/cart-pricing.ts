import type { CartItem } from '@/domains/storefront/cart/CartContext';

export const SHIPPING_THRESHOLD = 5000;
export const STANDARD_SHIPPING_FEE = 500;

const promoCatalog = {
  GAMESTOP10: {
    code: 'GAMESTOP10',
    label: '10% off your order',
    kind: 'percent',
    value: 10,
  },
} as const;

export type PromoCode = keyof typeof promoCatalog;

export function normalizePromoCode(code: string) {
  return code.trim().toUpperCase();
}

export function getPromoDetails(code?: string | null) {
  if (!code) return null;
  const normalizedCode = normalizePromoCode(code) as PromoCode;
  return promoCatalog[normalizedCode] ?? null;
}

export function isDigitalOnlyCart(items: CartItem[]) {
  return items.length > 0 && items.every((item) => item.isDigital);
}

export function getCartPricing(items: CartItem[], promoCode?: string | null) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const appliedPromo = getPromoDetails(promoCode);
  const discount =
    appliedPromo?.kind === 'percent'
      ? Math.round(subtotal * (appliedPromo.value / 100))
      : 0;
  const digitalOnly = isDigitalOnlyCart(items);
  const shippingCost = digitalOnly || subtotal >= SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const finalTotal = Math.max(0, subtotal - discount + shippingCost);
  const remainingForFreeShipping =
    digitalOnly || subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_THRESHOLD - subtotal;

  return {
    subtotal,
    itemCount,
    appliedPromo,
    discount,
    digitalOnly,
    shippingCost,
    finalTotal,
    remainingForFreeShipping,
  };
}
