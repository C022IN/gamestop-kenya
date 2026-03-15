import 'server-only';
import type { CartItem } from '@/context/CartContext';
import {
  getStorefrontCatalogSeed,
  syncStorefrontCatalogProducts,
} from '@/lib/storefront-catalog';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export interface StoreCheckoutCustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface StoreCheckoutShippingInfo {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  instructions: string;
}

export interface StoreCheckoutDeliveryInfo {
  channel: 'email' | 'whatsapp';
  note: string;
}

export interface StoreOrderRecord {
  id: string;
  orderNumber: string;
  items: CartItem[];
  customerInfo: StoreCheckoutCustomerInfo;
  shippingInfo?: StoreCheckoutShippingInfo;
  deliveryInfo?: StoreCheckoutDeliveryInfo;
  subtotalKes: number;
  discountKes: number;
  shippingKes: number;
  taxKes: number;
  totalKes: number;
  digitalOnly: boolean;
  promoCode?: string | null;
  paymentProvider: 'stripe' | 'mpesa' | 'free';
  paymentStatus: 'pending' | 'paid' | 'free';
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

interface OrderRow {
  id: string;
  order_number: string;
  subtotal_kes: number;
  shipping_kes: number;
  tax_kes: number;
  total_kes: number;
  payment_method: string | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

interface OrderItemRow {
  order_id: string;
  title: string;
  quantity: number;
  unit_price_kes: number;
  metadata: {
    id?: string;
    image?: string;
    platform?: string;
    isDigital?: boolean;
    variant?: string;
    details?: string[];
  } | null;
}

interface PaymentRow {
  order_id: string | null;
  provider: string;
  provider_reference: string | null;
  status: string;
  amount_kes: number;
  paid_at: string | null;
  metadata: {
    customerInfo?: StoreCheckoutCustomerInfo;
    shippingInfo?: StoreCheckoutShippingInfo;
    deliveryInfo?: StoreCheckoutDeliveryInfo;
    promoCode?: string | null;
    discountKes?: number;
    taxKes?: number;
    digitalOnly?: boolean;
  } | null;
}

const storeOrders = new Map<string, StoreOrderRecord>();
const providerReferenceIndex = new Map<string, string>();

function generateOrderNumber() {
  return `GS${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
}

function fromRows(order: OrderRow, items: OrderItemRow[], payment: PaymentRow | null): StoreOrderRecord {
  const paymentMetadata = payment?.metadata ?? {};
  if (payment?.provider_reference) {
    providerReferenceIndex.set(`${payment.provider}:${payment.provider_reference}`, order.id);
  }

  return {
    id: order.id,
    orderNumber: order.order_number,
    items: items.map((item, index) => ({
      id: item.metadata?.id ?? `${order.id}-${index}`,
      title: item.title,
      image: item.metadata?.image ?? '',
      price: item.unit_price_kes,
      platform: item.metadata?.platform ?? 'Storefront',
      quantity: item.quantity,
      isDigital: item.metadata?.isDigital,
      variant: item.metadata?.variant,
      details: item.metadata?.details,
    })),
    customerInfo: paymentMetadata.customerInfo ?? {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    shippingInfo: paymentMetadata.shippingInfo,
    deliveryInfo: paymentMetadata.deliveryInfo,
    subtotalKes: order.subtotal_kes,
    discountKes: paymentMetadata.discountKes ?? 0,
    shippingKes: order.shipping_kes,
    taxKes: order.tax_kes ?? paymentMetadata.taxKes ?? 0,
    totalKes: order.total_kes,
    digitalOnly: paymentMetadata.digitalOnly ?? false,
    promoCode: paymentMetadata.promoCode ?? null,
    paymentProvider: (payment?.provider ?? 'stripe') as StoreOrderRecord['paymentProvider'],
    paymentStatus: (payment?.status === 'paid'
      ? 'paid'
      : payment?.provider === 'free'
        ? 'free'
        : 'pending') as StoreOrderRecord['paymentStatus'],
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    paidAt: payment?.paid_at ?? undefined,
  };
}

export async function createStoreOrder(params: {
  items: CartItem[];
  customerInfo: StoreCheckoutCustomerInfo;
  shippingInfo?: StoreCheckoutShippingInfo;
  deliveryInfo?: StoreCheckoutDeliveryInfo;
  subtotalKes: number;
  discountKes: number;
  shippingKes: number;
  taxKes?: number;
  totalKes: number;
  digitalOnly: boolean;
  promoCode?: string | null;
  paymentProvider: 'stripe' | 'mpesa' | 'free';
  providerReference?: string;
  paid?: boolean;
}): Promise<StoreOrderRecord> {
  const now = new Date().toISOString();
  const order: StoreOrderRecord = {
    id: `order_${Math.random().toString(36).slice(2, 10)}`,
    orderNumber: generateOrderNumber(),
    items: params.items,
    customerInfo: params.customerInfo,
    shippingInfo: params.shippingInfo,
    deliveryInfo: params.deliveryInfo,
    subtotalKes: params.subtotalKes,
    discountKes: params.discountKes,
    shippingKes: params.shippingKes,
    taxKes: params.taxKes ?? 0,
    totalKes: params.totalKes,
    digitalOnly: params.digitalOnly,
    promoCode: params.promoCode ?? null,
    paymentProvider: params.paymentProvider,
    paymentStatus: params.paid
      ? params.paymentProvider === 'free'
        ? 'free'
        : 'paid'
      : 'pending',
    createdAt: now,
    updatedAt: now,
    paidAt: params.paid ? now : undefined,
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const catalogProductIds = params.items
      .map((item) => getStorefrontCatalogSeed(item.id)?.id ?? null)
      .filter((id): id is string => Boolean(id));

    if (catalogProductIds.length > 0) {
      await syncStorefrontCatalogProducts(catalogProductIds);
    }

    const { data: orderRow } = await supabase
      .from('orders')
      .insert({
        order_number: order.orderNumber,
        status: params.paid ? 'processing' : 'pending',
        fulfillment_status: params.digitalOnly ? 'digital_pending' : 'unfulfilled',
        currency_code: 'KES',
        subtotal_kes: params.subtotalKes,
        shipping_kes: params.shippingKes,
        tax_kes: params.taxKes ?? 0,
        total_kes: params.totalKes,
        payment_status: params.paid ? 'paid' : 'pending',
        payment_method: params.paymentProvider,
        notes: params.digitalOnly
          ? params.deliveryInfo?.note ?? null
          : params.shippingInfo?.instructions ?? null,
      })
      .select('id, order_number, subtotal_kes, shipping_kes, tax_kes, total_kes, payment_method, payment_status, created_at, updated_at')
      .maybeSingle();

    const id = (orderRow as OrderRow | null)?.id ?? order.id;

    await supabase.from('order_items').insert(
      params.items.map((item) => ({
        order_id: id,
        product_id: getStorefrontCatalogSeed(item.id)?.id ?? null,
        title: item.title,
        quantity: item.quantity,
        unit_price_kes: item.price,
        total_price_kes: item.price * item.quantity,
        metadata: {
          id: item.id,
          image: item.image,
          platform: item.platform,
          isDigital: item.isDigital ?? false,
          variant: item.variant,
          details: item.details ?? [],
        },
      }))
    );

    await supabase.from('payments').insert({
      order_id: id,
      provider: params.paymentProvider,
      provider_reference: params.providerReference ?? null,
      status: params.paid ? 'paid' : 'pending',
      amount_kes: params.totalKes,
      currency_code: 'KES',
      paid_at: params.paid ? now : null,
      metadata: {
        customerInfo: params.customerInfo,
        shippingInfo: params.shippingInfo,
        deliveryInfo: params.deliveryInfo,
        promoCode: params.promoCode ?? null,
        discountKes: params.discountKes,
        taxKes: params.taxKes ?? 0,
        digitalOnly: params.digitalOnly,
      },
    });

    if (params.providerReference) {
      providerReferenceIndex.set(`${params.paymentProvider}:${params.providerReference}`, id);
    }

    return (await getStoreOrderById(id)) ?? { ...order, id };
  }

  storeOrders.set(order.id, order);
  if (params.providerReference) {
    providerReferenceIndex.set(`${params.paymentProvider}:${params.providerReference}`, order.id);
  }
  return order;
}

export async function getStoreOrderById(id: string): Promise<StoreOrderRecord | null> {
  const cached = storeOrders.get(id);
  if (cached) return cached;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, subtotal_kes, shipping_kes, tax_kes, total_kes, payment_method, payment_status, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (orderError || !orderData) return null;

  const [{ data: itemData }, { data: paymentData }] = await Promise.all([
    supabase
      .from('order_items')
      .select('order_id, title, quantity, unit_price_kes, metadata')
      .eq('order_id', id),
    supabase
      .from('payments')
      .select('order_id, provider, provider_reference, status, amount_kes, paid_at, metadata')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const order = fromRows(
    orderData as OrderRow,
    (itemData as OrderItemRow[] | null) ?? [],
    (paymentData as PaymentRow | null) ?? null
  );
  storeOrders.set(order.id, order);
  return order;
}

export async function markStoreOrderPaid(params: {
  orderId: string;
  provider: 'stripe' | 'mpesa' | 'free';
  providerReference?: string;
  taxKes?: number;
  totalKes?: number;
}): Promise<StoreOrderRecord | null> {
  const existing = await getStoreOrderById(params.orderId);
  if (!existing) return null;
  if (existing.paymentStatus !== 'pending') return existing;

  const now = new Date().toISOString();
  const updated: StoreOrderRecord = {
    ...existing,
    paymentProvider: params.provider,
    paymentStatus: params.provider === 'free' ? 'free' : 'paid',
    taxKes: params.taxKes ?? existing.taxKes,
    totalKes: params.totalKes ?? existing.totalKes,
    updatedAt: now,
    paidAt: now,
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase
      .from('orders')
      .update({
        status: 'processing',
        payment_status: 'paid',
        payment_method: params.provider,
        tax_kes: updated.taxKes,
        total_kes: updated.totalKes,
        updated_at: now,
      })
      .eq('id', params.orderId);

    await supabase
      .from('payments')
      .update({
        provider: params.provider,
        provider_reference: params.providerReference ?? null,
        status: 'paid',
        amount_kes: updated.totalKes,
        paid_at: now,
        metadata: {
          customerInfo: existing.customerInfo,
          shippingInfo: existing.shippingInfo,
          deliveryInfo: existing.deliveryInfo,
          promoCode: existing.promoCode ?? null,
          discountKes: existing.discountKes,
          taxKes: updated.taxKes,
          digitalOnly: existing.digitalOnly,
        },
        updated_at: now,
      })
      .eq('order_id', params.orderId);
  }

  if (params.providerReference) {
    providerReferenceIndex.set(`${params.provider}:${params.providerReference}`, params.orderId);
  }
  storeOrders.set(updated.id, updated);
  return updated;
}

export async function setStoreOrderProviderReference(
  orderId: string,
  provider: 'stripe' | 'mpesa' | 'free',
  providerReference: string
) {
  providerReferenceIndex.set(`${provider}:${providerReference}`, orderId);
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase
      .from('payments')
      .update({
        provider,
        provider_reference: providerReference,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);
  }
}

export async function getStoreOrderByProviderReference(
  provider: 'stripe' | 'mpesa' | 'free',
  providerReference: string
): Promise<StoreOrderRecord | null> {
  const cachedOrderId = providerReferenceIndex.get(`${provider}:${providerReference}`);
  if (cachedOrderId) {
    return getStoreOrderById(cachedOrderId);
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('payments')
    .select('order_id')
    .eq('provider', provider)
    .eq('provider_reference', providerReference)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const orderId = (data as { order_id?: string | null } | null)?.order_id ?? null;
  if (error || !orderId) return null;

  providerReferenceIndex.set(`${provider}:${providerReference}`, orderId);
  return getStoreOrderById(orderId);
}
