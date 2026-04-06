import { NextRequest, NextResponse } from 'next/server';
import type { CartItem } from '@/domains/storefront/cart/CartContext';
import { getCartPricing } from '@/lib/cart-pricing';
import { isStateRequiredForCheckout } from '@/lib/checkout-countries';
import { initiateStkPush } from '@/lib/mpesa';
import {
  createStoreOrder,
  setStoreOrderProviderReference,
  type StoreCheckoutCustomerInfo,
  type StoreCheckoutDeliveryInfo,
  type StoreCheckoutShippingInfo,
} from '@/lib/store-orders';
import { verifyTurnstileRequest } from '@/lib/turnstile';

export async function POST(req: NextRequest) {
  try {
    const {
      items,
      customerInfo,
      shippingInfo,
      deliveryInfo,
      promoCode,
      phone,
      turnstileToken,
    } = (await req.json()) as {
      items?: CartItem[];
      customerInfo?: StoreCheckoutCustomerInfo;
      shippingInfo?: StoreCheckoutShippingInfo;
      deliveryInfo?: StoreCheckoutDeliveryInfo;
      promoCode?: string | null;
      phone?: string;
      turnstileToken?: string;
    };

    if (!items?.length || !customerInfo?.email || !customerInfo.phone) {
      return NextResponse.json(
        { error: 'items, customerInfo.email, and customerInfo.phone are required' },
        { status: 400 }
      );
    }

    const pricing = getCartPricing(items, promoCode);
    const requiresState = isStateRequiredForCheckout(shippingInfo?.country);

    if (
      !pricing.digitalOnly &&
      (
        !shippingInfo?.address ||
        !shippingInfo.city ||
        !shippingInfo.country ||
        !shippingInfo.postalCode ||
        (requiresState && !shippingInfo.state)
      )
    ) {
      return NextResponse.json(
        {
          error:
            'shippingInfo.address, city, country, and postalCode are required for physical orders.',
        },
        { status: 400 }
      );
    }

    if (!pricing.digitalOnly && shippingInfo?.country !== 'KE') {
      return NextResponse.json(
        {
          error:
            'International VAT and sales tax are handled through Stripe Checkout. Use Stripe for non-Kenyan physical orders.',
        },
        { status: 400 }
      );
    }

    const verification = await verifyTurnstileRequest(req, turnstileToken);
    if (!verification.ok) {
      return NextResponse.json({ error: verification.error }, { status: verification.status });
    }

    const order = await createStoreOrder({
      items,
      customerInfo,
      shippingInfo: pricing.digitalOnly ? undefined : shippingInfo,
      deliveryInfo: pricing.digitalOnly ? deliveryInfo : undefined,
      subtotalKes: pricing.subtotal,
      discountKes: pricing.discount,
      shippingKes: pricing.shippingCost,
      totalKes: pricing.finalTotal,
      digitalOnly: pricing.digitalOnly,
      promoCode,
      paymentProvider: pricing.finalTotal === 0 ? 'free' : 'mpesa',
      paid: pricing.finalTotal === 0,
    });

    if (pricing.finalTotal === 0) {
      return NextResponse.json({
        kind: 'free',
        order,
      });
    }

    const result = await initiateStkPush({
      phone: phone || customerInfo.phone,
      amount: pricing.finalTotal,
      orderId: order.orderNumber,
      description: pricing.digitalOnly
        ? `GameStop Kenya digital order ${order.orderNumber}`
        : `GameStop Kenya order ${order.orderNumber}`,
    });

    if (!result.success || !result.checkoutRequestId) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to initiate M-Pesa payment.' },
        { status: 502 }
      );
    }

    await setStoreOrderProviderReference(order.id, 'mpesa', result.checkoutRequestId);

    return NextResponse.json({
      kind: 'mpesa',
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutRequestId: result.checkoutRequestId,
      merchantRequestId: result.merchantRequestId,
      customerMessage: result.customerMessage,
    });
  } catch (error) {
    console.error('Store M-Pesa create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create M-Pesa order.' },
      { status: 500 }
    );
  }
}
