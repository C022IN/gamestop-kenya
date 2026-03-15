import 'server-only';

import {
  getStorefrontSeedProductById,
  getStorefrontSeedProducts,
  type StorefrontSeedProduct,
} from '@/lib/storefront-media';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

interface ProductRow {
  id: string;
  image_url: string | null;
  sku: string | null;
  metadata: Record<string, unknown> | null;
}

interface OrderItemRow {
  order_id: string;
  product_id: string | null;
  quantity: number;
  total_price_kes: number;
  metadata: {
    id?: string;
  } | null;
}

interface OrderRow {
  id: string;
  created_at: string;
}

export interface StorefrontCatalogProductRecord {
  id: string;
  sku: string;
  imageUrl: string | null;
  lastSeedSyncAt?: string;
}

export interface StorefrontCatalogSalesStats {
  orderCount: number;
  unitsSold: number;
  revenueKes: number;
  lastSoldAt?: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function toSku(seed: StorefrontSeedProduct) {
  return seed.id.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toUpperCase();
}

function getSeeds(ids?: string[]) {
  const source = getStorefrontSeedProducts();
  if (!ids?.length) {
    return source;
  }

  const allowed = new Set(ids);
  return source.filter((seed) => allowed.has(seed.id));
}

export function getStorefrontCatalogSeed(productId: string) {
  return getStorefrontSeedProductById(productId);
}

export async function syncStorefrontCatalogProducts(ids?: string[]) {
  const supabase = getSupabaseAdminClient();
  const records = new Map<string, StorefrontCatalogProductRecord>();
  if (!supabase) {
    return records;
  }

  const seeds = getSeeds(ids);
  if (!seeds.length) {
    return records;
  }

  const now = new Date().toISOString();
  const { data: existingRows } = await supabase
    .from('products')
    .select('id, image_url, sku, metadata')
    .in('id', seeds.map((seed) => seed.id));

  const existingById = new Map(
    ((existingRows as ProductRow[] | null) ?? []).map((row) => [row.id, row])
  );

  const payload = seeds.map((seed) => {
    const existing = existingById.get(seed.id);
    const metadata = (existing?.metadata ?? {}) as Record<string, unknown>;
    const nextMetadata = {
      ...metadata,
      storefrontKind: seed.kind,
      fallbackImage: seed.image,
      formatLabel: seed.formatLabel ?? metadata.formatLabel ?? null,
      catalogSource: 'seed',
      seedManaged: true,
      lastSeedSyncAt: now,
    };

    return {
      id: seed.id,
      title: seed.title,
      slug: slugify(seed.title),
      description: seed.blurb ?? null,
      platform: seed.platform ?? null,
      image_url: existing?.image_url ?? seed.image,
      price_kes: seed.price,
      original_price_kes: seed.originalPrice ?? null,
      currency_code: 'KES',
      rating: seed.rating ?? null,
      in_stock: seed.inStock ?? true,
      is_digital: seed.isDigital ?? false,
      sku: existing?.sku ?? toSku(seed),
      metadata: nextMetadata,
      updated_at: now,
    };
  });

  const { data: syncedRows } = await supabase
    .from('products')
    .upsert(payload, { onConflict: 'id' })
    .select('id, image_url, sku, metadata');

  for (const row of (syncedRows as ProductRow[] | null) ?? []) {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    records.set(row.id, {
      id: row.id,
      sku: row.sku ?? toSku(getStorefrontSeedProductById(row.id)!),
      imageUrl: row.image_url,
      lastSeedSyncAt:
        typeof metadata.lastSeedSyncAt === 'string' ? metadata.lastSeedSyncAt : undefined,
    });
  }

  return records;
}

export async function getStorefrontCatalogSalesStats(ids?: string[]) {
  const supabase = getSupabaseAdminClient();
  const stats = new Map<string, StorefrontCatalogSalesStats>();
  if (!supabase) {
    return stats;
  }

  const seeds = getSeeds(ids);
  if (!seeds.length) {
    return stats;
  }

  const allowedIds = new Set(seeds.map((seed) => seed.id));
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('order_id, product_id, quantity, total_price_kes, metadata');

  const relevantItems = ((orderItems as OrderItemRow[] | null) ?? [])
    .map((item) => {
      const metadataId = typeof item.metadata?.id === 'string' ? item.metadata.id : null;
      const productId = item.product_id ?? metadataId;
      return {
        ...item,
        productId,
      };
    })
    .filter((item): item is OrderItemRow & { productId: string } => {
      const { productId } = item;
      return typeof productId === 'string' && allowedIds.has(productId);
    });

  if (!relevantItems.length) {
    return stats;
  }

  const orderIds = Array.from(new Set(relevantItems.map((item) => item.order_id)));
  const { data: orderRows } = await supabase
    .from('orders')
    .select('id, created_at')
    .in('id', orderIds);

  const orderDates = new Map(
    ((orderRows as OrderRow[] | null) ?? []).map((row) => [row.id, row.created_at])
  );
  const orderIdsByProduct = new Map<string, Set<string>>();

  for (const item of relevantItems) {
    const current = stats.get(item.productId) ?? {
      orderCount: 0,
      unitsSold: 0,
      revenueKes: 0,
      lastSoldAt: undefined,
    };

    current.unitsSold += item.quantity;
    current.revenueKes += item.total_price_kes;

    const orderSet = orderIdsByProduct.get(item.productId) ?? new Set<string>();
    orderSet.add(item.order_id);
    orderIdsByProduct.set(item.productId, orderSet);

    const soldAt = orderDates.get(item.order_id);
    if (soldAt && (!current.lastSoldAt || soldAt > current.lastSoldAt)) {
      current.lastSoldAt = soldAt;
    }

    stats.set(item.productId, current);
  }

  for (const [productId, productStats] of stats) {
    productStats.orderCount = orderIdsByProduct.get(productId)?.size ?? 0;
  }

  return stats;
}
