import { NextRequest, NextResponse } from 'next/server';
import type { CartItem } from '@/context/CartContext';
import { getAppUrl } from '@/lib/app-url';
import { createBillingLink } from '@/lib/billing-links';
import { getCartPricing } from '@/lib/cart-pricing';
import { isStateRequiredForCheckout } from '@/lib/checkout-countries';
import { getStripeServerClient } from '@/lib/stripe/server';
import {
  getStripeAutomaticTaxParams,
  getStripeProductTaxCode,
  getStripeShippingTaxCodeValue,
  getStripeTaxBehaviorValue,
  toStripeAmount,
} from '@/lib/stripe/tax';
import {
  createStoreOrder,
  setStoreOrderProviderReference,
  type StoreCheckoutCustomerInfo,
  type StoreCheckoutDeliveryInfo,
  type StoreCheckoutShippingInfo,
} from '@/lib/store-orders';

function allocateLineDiscounts(items: CartItem[], totalDiscount: number) {
  if (totalDiscount <= 0) {
    return items.map(() => 0);
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (subtotal <= 0) {
    return items.map(() => 0);
  }

  let allocated = 0;
  return items.map((item, index) => {
    if (index === items.length - 1) {
      return totalDiscount - allocated;
    }

    const lineSubtotal = item.price * item.quantity;
    const lineDiscount = Math.round((lineSubtotal / subtotal) * totalDiscount);
    allocated += lineDiscount;
    return lineDiscount;
  });
}

function getItemDescription(item: CartItem) {
  const parts = [item.platform];
  if (item.variant) parts.push(item.variant);
  if (item.isDigital) parts.push('digital delivery');
  return parts.filter(Boolean).join(' | ');
}

export async function POST(req: NextRequest) {
  try {
    const { items, customerInfo, shippingInfo, deliveryInfo, promoCode } = (await req.json()) as {
      items?: CartItem[];
      customerInfo?: StoreCheckoutCustomerInfo;
      shippingInfo?: StoreCheckoutShippingInfo;
      deliveryInfo?: StoreCheckoutDeliveryInfo;
      promoCode?: string | null;
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
      paymentProvider: pricing.finalTotal === 0 ? 'free' : 'stripe',
      paid: pricing.finalTotal === 0,
    });

    if (pricing.finalTotal === 0) {
      await createBillingLink({
        kind: 'store_order',
        recordId: order.id,
        metadata: { paymentFlow: 'free_checkout' },
      });

      return NextResponse.json({
        kind: 'free',
        order,
      });
    }

    const stripe = getStripeServerClient();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Card payments are currently unavailable.' },
        { status: 503 }
      );
    }

    const fullName = `${customerInfo.firstName} ${customerInfo.lastName}`.trim();
    const customer = await stripe.customers.create({
      name: fullName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      metadata: {
        context: 'store_order',
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      ...(pricing.digitalOnly || !shippingInfo
        ? {}
        : {
            address: {
              line1: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state || undefined,
              postal_code: shippingInfo.postalCode,
              country: shippingInfo.country,
            },
            shipping: {
              name: fullName,
              phone: customerInfo.phone,
              address: {
                line1: shippingInfo.address,
                city: shippingInfo.city,
                state: shippingInfo.state || undefined,
                postal_code: shippingInfo.postalCode,
                country: shippingInfo.country,
              },
            },
          }),
    });

    const taxBehavior = getStripeTaxBehaviorValue();
    const lineDiscounts = allocateLineDiscounts(items, pricing.discount);
    const lineItems = items.map((item, index) => {
      const taxCode = getStripeProductTaxCode(item.isDigital ? 'digital' : 'physical');
      const lineSubtotal = item.price * item.quantity;
      const lineAmount = Math.max(0, lineSubtotal - lineDiscounts[index]);

      return {
        quantity: 1,
        price_data: {
          currency: 'kes',
          unit_amount: toStripeAmount(lineAmount),
          tax_behavior: taxBehavior,
          product_data: {
            name: item.quantity > 1 ? `${item.title} x${item.quantity}` : item.title,
            description: getItemDescription(item),
            ...(taxCode ? { tax_code: taxCode } : {}),
          },
        },
      };
    });

    if (pricing.shippingCost > 0) {
      const shippingTaxCode = getStripeShippingTaxCodeValue();
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'kes',
          unit_amount: toStripeAmount(pricing.shippingCost),
          tax_behavior: taxBehavior,
          product_data: {
            name: 'Standard Shipping',
            description: 'Destination-based shipping charge',
            ...(shippingTaxCode ? { tax_code: shippingTaxCode } : {}),
          },
        },
      });
    }

    const appUrl = getAppUrl(req.nextUrl.origin);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${appUrl}/checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout?canceled=1`,
      customer: customer.id,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      phone_number_collection: {
        enabled: true,
      },
      line_items: lineItems,
      metadata: {
        context: 'store_order',
        orderId: order.id,
        orderNumber: order.orderNumber,
        digitalOnly: String(pricing.digitalOnly),
      },
      payment_method_types: ['card'],
      ...getStripeAutomaticTaxParams(),
    });

    await setStoreOrderProviderReference(order.id, 'stripe', session.id);
    await createBillingLink({
      kind: 'store_order',
      recordId: order.id,
      stripeCustomerId: customer.id,
      stripeSessionId: session.id,
      metadata: { orderNumber: order.orderNumber },
    });

    return NextResponse.json({
      kind: 'stripe',
      url: session.url,
      sessionId: session.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error('Stripe store checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe checkout session.' },
      { status: 500 }
    );
  }
}
