import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getHardwareShowcaseCardsByIds,
  hardwareCatalog,
} from '@/data/hardware-catalog';
import { gameCatalog, getShowcaseCardsByIds } from '@/data/game-catalog';
import { giftCardProducts } from '@/data/gift-cards';
import type {
  StorefrontImageAspect,
  StorefrontImageFit,
  StorefrontKind,
  StorefrontProduct,
  StorefrontShowcaseCard,
} from '@/lib/storefront-types';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

interface ProductRow {
  id: string;
  image_url: string | null;
  metadata: Record<string, unknown> | null;
}

interface ProductMediaRow {
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  metadata: Record<string, unknown> | null;
}

type MediaMetadata = {
  imageAspect?: StorefrontImageAspect;
  imageFit?: StorefrontImageFit;
  imagePosition?: string;
  licenseType?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  usageScope?: string;
  notes?: string;
  lastSyncedAt?: string;
};

export interface StorefrontSeedProduct {
  id: string;
  kind: StorefrontKind;
  title: string;
  platform?: string;
  image: string;
  price: number;
  originalPrice?: number;
  isDigital?: boolean;
}

export interface StorefrontMediaOverride {
  image: string;
  altText?: string;
  imageAspect?: StorefrontImageAspect;
  imageFit?: StorefrontImageFit;
  imagePosition?: string;
  gallery: string[];
  metadata?: Record<string, unknown>;
}

function storefrontKindFromMetadata(value: unknown): StorefrontKind | null {
  return value === 'games' || value === 'gift-cards' || value === 'hardware' ? value : null;
}

function hasManagedCatalogOverride(product: ProductRow, expectedKind?: StorefrontKind) {
  const metadata = (product.metadata ?? {}) as Record<string, unknown>;
  const isManaged = metadata.mediaManaged === true;
  const productKind = storefrontKindFromMetadata(metadata.storefrontKind);

  if (!isManaged) {
    return false;
  }

  if (expectedKind && productKind !== expectedKind) {
    return false;
  }

  return true;
}

export function readMediaMetadata(metadata?: Record<string, unknown> | null): MediaMetadata {
  return {
    imageAspect:
      metadata?.imageAspect === 'portrait' ||
      metadata?.imageAspect === 'card' ||
      metadata?.imageAspect === 'wide'
        ? metadata.imageAspect
        : undefined,
    imageFit:
      metadata?.imageFit === 'cover' || metadata?.imageFit === 'contain'
        ? metadata.imageFit
        : undefined,
    imagePosition: typeof metadata?.imagePosition === 'string' ? metadata.imagePosition : undefined,
    licenseType: typeof metadata?.licenseType === 'string' ? metadata.licenseType : undefined,
    sourceLabel: typeof metadata?.sourceLabel === 'string' ? metadata.sourceLabel : undefined,
    sourceUrl: typeof metadata?.sourceUrl === 'string' ? metadata.sourceUrl : undefined,
    usageScope: typeof metadata?.usageScope === 'string' ? metadata.usageScope : undefined,
    notes: typeof metadata?.notes === 'string' ? metadata.notes : undefined,
    lastSyncedAt: typeof metadata?.lastSyncedAt === 'string' ? metadata.lastSyncedAt : undefined,
  };
}

export function getStorefrontSeedProducts(): StorefrontSeedProduct[] {
  return [
    ...gameCatalog.map((product) => ({
      id: product.id,
      kind: 'games' as const,
      title: product.title,
      platform: product.platform,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      isDigital: product.isDigital,
    })),
    ...hardwareCatalog.map((product) => ({
      id: product.id,
      kind: 'hardware' as const,
      title: product.title,
      platform: product.platform,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      isDigital: product.isDigital,
    })),
    ...giftCardProducts.map((product) => ({
      id: product.id,
      kind: 'gift-cards' as const,
      title: product.title,
      platform: product.platform,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      isDigital: product.isDigital,
    })),
  ];
}

export function getStorefrontSeedProductById(productId: string) {
  return getStorefrontSeedProducts().find((product) => product.id === productId) ?? null;
}

async function getProductMediaRows(supabase: SupabaseClient, productIds?: string[]) {
  let query = supabase
    .from('product_media')
    .select('product_id, url, alt_text, sort_order, metadata')
    .order('sort_order', { ascending: true });

  if (productIds?.length) {
    query = query.in('product_id', productIds);
  }

  const { data, error } = await query;
  if (!error) {
    return (data as ProductMediaRow[] | null) ?? [];
  }

  let fallbackQuery = supabase
    .from('product_media')
    .select('product_id, url, alt_text, sort_order')
    .order('sort_order', { ascending: true });

  if (productIds?.length) {
    fallbackQuery = fallbackQuery.in('product_id', productIds);
  }

  const { data: fallbackData } = await fallbackQuery;

  return ((fallbackData as Array<Omit<ProductMediaRow, 'metadata'>> | null) ?? []).map((row) => ({
    ...row,
    metadata: null,
  }));
}

export async function getStorefrontMediaOverrides(
  productIds?: string[],
  expectedKind?: StorefrontKind
) {
  const supabase = getSupabaseAdminClient();
  const overrides = new Map<string, StorefrontMediaOverride>();

  if (!supabase) {
    return overrides;
  }

  let productQuery = supabase.from('products').select('id, image_url, metadata');

  if (productIds?.length) {
    productQuery = productQuery.in('id', productIds);
  }

  const [{ data: productRows, error: productError }, mediaRows] = await Promise.all([
    productQuery,
    getProductMediaRows(supabase, productIds),
  ]);

  if (productError) {
    return overrides;
  }

  const mediaByProduct = new Map<string, ProductMediaRow[]>();

  for (const row of mediaRows) {
    const existing = mediaByProduct.get(row.product_id) ?? [];
    existing.push(row);
    mediaByProduct.set(row.product_id, existing);
  }

  for (const product of (productRows as ProductRow[] | null) ?? []) {
    if (!hasManagedCatalogOverride(product, expectedKind)) {
      continue;
    }

    const media = mediaByProduct.get(product.id) ?? [];
    const primaryMedia = media[0];
    const productMeta = readMediaMetadata(product.metadata);
    const mediaMeta = readMediaMetadata(primaryMedia?.metadata);
    const primaryImage = primaryMedia?.url ?? product.image_url ?? undefined;

    if (!primaryImage) continue;

    overrides.set(product.id, {
      image: primaryImage,
      altText: primaryMedia?.alt_text ?? undefined,
      imageAspect: mediaMeta.imageAspect ?? productMeta.imageAspect,
      imageFit: mediaMeta.imageFit ?? productMeta.imageFit,
      imagePosition: mediaMeta.imagePosition ?? productMeta.imagePosition,
      gallery: media.map((entry) => entry.url),
      metadata: {
        ...(product.metadata ?? {}),
        ...(primaryMedia?.metadata ?? {}),
      },
    });
  }

  return overrides;
}

export function mergeStorefrontProductsWithMedia<T extends StorefrontProduct>(
  products: T[],
  overrides: Map<string, StorefrontMediaOverride>
): T[] {
  return products.map((product) => {
    const override = overrides.get(product.id);
    if (!override) return product;

    return {
      ...product,
      image: override.image,
      imageAspect: override.imageAspect ?? product.imageAspect,
      imageFit: override.imageFit ?? product.imageFit,
      imagePosition: override.imagePosition ?? product.imagePosition,
    };
  });
}

export function mergeShowcaseCardsWithMedia(
  cards: StorefrontShowcaseCard[],
  overrides: Map<string, StorefrontMediaOverride>
) {
  return cards.map((card) => {
    const override = overrides.get(card.id);
    if (!override) return card;

    return {
      ...card,
      image: override.image,
      imageAspect: override.imageAspect ?? card.imageAspect,
      imageFit: override.imageFit ?? card.imageFit,
      imagePosition: override.imagePosition ?? card.imagePosition,
    };
  });
}

export async function getMergedStorefrontProducts(kind: StorefrontKind, ids?: string[]) {
  const source =
    kind === 'games'
      ? gameCatalog
      : kind === 'hardware'
        ? hardwareCatalog
        : giftCardProducts;
  const scoped = ids?.length ? source.filter((product) => ids.includes(product.id)) : source;
  const overrides = await getStorefrontMediaOverrides(
    scoped.map((product) => product.id),
    kind
  );
  return mergeStorefrontProductsWithMedia(scoped, overrides);
}

export async function getMergedGameShowcaseCards(ids: readonly string[], hrefBase = '/games') {
  const cards = getShowcaseCardsByIds(ids, hrefBase);
  const overrides = await getStorefrontMediaOverrides(
    cards.map((card) => card.id),
    'games'
  );
  return mergeShowcaseCardsWithMedia(cards, overrides);
}

export async function getMergedHardwareShowcaseCards(
  ids: readonly string[],
  hrefBase:
    | string
    | ((product: (typeof hardwareCatalog)[number]) => string) = '/accessories'
) {
  const cards = getHardwareShowcaseCardsByIds(ids, hrefBase);
  const overrides = await getStorefrontMediaOverrides(
    cards.map((card) => card.id),
    'hardware'
  );
  return mergeShowcaseCardsWithMedia(cards, overrides);
}

export async function getMergedGiftCardShowcaseCards(
  productIds: readonly string[],
  href = '/gift-cards'
) {
  const cards = giftCardProducts
    .filter((product) => productIds.includes(product.id))
    .map((product) => ({
      id: product.id,
      title: product.title,
      label: `${product.brand} | ${product.formatLabel}`,
      image: product.image,
      href,
      blurb: product.blurb,
      imageAspect: product.imageAspect,
      imageFit: product.imageFit,
      imagePosition: product.imagePosition,
    }));
  const overrides = await getStorefrontMediaOverrides(
    cards.map((card) => card.id),
    'gift-cards'
  );
  return mergeShowcaseCardsWithMedia(cards, overrides);
}
