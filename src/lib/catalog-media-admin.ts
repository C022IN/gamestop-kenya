import 'server-only';

import type { StorefrontImageAspect, StorefrontImageFit } from '@/lib/storefront-types';
import {
  getStorefrontMediaOverrides,
  getStorefrontSeedProductById,
  getStorefrontSeedProducts,
  readMediaMetadata,
  type StorefrontKind,
} from '@/lib/storefront-media';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

interface ActorContext {
  id: string;
  name: string;
}

interface ExistingProductRow {
  id: string;
  metadata: Record<string, unknown> | null;
}

export interface CatalogMediaEntry {
  id: string;
  kind: StorefrontKind;
  title: string;
  platform?: string;
  price: number;
  originalPrice?: number;
  isDigital?: boolean;
  fallbackImage: string;
  storefrontImage: string;
  hasOverride: boolean;
  media: {
    primaryImageUrl: string | null;
    gallery: string[];
    altText: string;
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
}

export interface CatalogMediaUpsertInput {
  productId: string;
  primaryImageUrl: string;
  galleryUrls?: string[];
  altText?: string;
  imageAspect?: StorefrontImageAspect;
  imageFit?: StorefrontImageFit;
  imagePosition?: string;
  licenseType?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  usageScope?: string;
  notes?: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function normalizeText(value?: string | null) {
  const next = value?.trim();
  return next ? next : null;
}

function normalizeUrl(value?: string | null) {
  const next = normalizeText(value);
  if (!next) return null;

  if (next.startsWith('/')) {
    return next;
  }

  if (/^https?:\/\//i.test(next)) {
    return next;
  }

  return null;
}

function uniqueUrls(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const value of values) {
    const url = normalizeUrl(value);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }

  return urls;
}

async function getEntryByProductId(productId: string) {
  const [entry] = await listCatalogMediaEntries(undefined, [productId]);
  return entry ?? null;
}

function defaultAspect(kind: StorefrontKind): StorefrontImageAspect {
  return kind === 'gift-cards' ? 'card' : 'portrait';
}

function defaultFit(kind: StorefrontKind): StorefrontImageFit {
  return kind === 'gift-cards' ? 'contain' : 'cover';
}

export function hasCatalogMediaPersistence() {
  return Boolean(getSupabaseAdminClient());
}

export async function listCatalogMediaEntries(kind?: StorefrontKind, ids?: string[]) {
  const seeds = getStorefrontSeedProducts()
    .filter((product) => !kind || product.kind === kind)
    .filter((product) => !ids?.length || ids.includes(product.id))
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind.localeCompare(right.kind);
      }

      return left.title.localeCompare(right.title);
    });

  const overrides = await getStorefrontMediaOverrides(seeds.map((product) => product.id));

  return seeds.map((seed) => {
    const override = overrides.get(seed.id);
    const metadata = readMediaMetadata((override?.metadata as Record<string, unknown> | undefined) ?? null);

    return {
      id: seed.id,
      kind: seed.kind,
      title: seed.title,
      platform: seed.platform,
      price: seed.price,
      originalPrice: seed.originalPrice,
      isDigital: seed.isDigital,
      fallbackImage: seed.image,
      storefrontImage: override?.image ?? seed.image,
      hasOverride: Boolean(override),
      media: {
        primaryImageUrl: override?.image ?? null,
        gallery: override?.gallery ?? [],
        altText: override?.altText ?? seed.title,
        imageAspect: metadata.imageAspect ?? defaultAspect(seed.kind),
        imageFit: metadata.imageFit ?? defaultFit(seed.kind),
        imagePosition: metadata.imagePosition,
        licenseType: metadata.licenseType,
        sourceLabel: metadata.sourceLabel,
        sourceUrl: metadata.sourceUrl,
        usageScope: metadata.usageScope,
        notes: metadata.notes,
        lastSyncedAt: metadata.lastSyncedAt,
      },
    } satisfies CatalogMediaEntry;
  });
}

export async function upsertCatalogMediaEntry(
  input: CatalogMediaUpsertInput,
  actor?: ActorContext
) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      ok: false as const,
      error: 'Supabase server credentials are not configured. Add them before saving catalog media.',
    };
  }

  const seed = getStorefrontSeedProductById(input.productId);
  if (!seed) {
    return {
      ok: false as const,
      error: `Unknown storefront product: ${input.productId}`,
    };
  }

  const primaryImageUrl = normalizeUrl(input.primaryImageUrl);
  if (!primaryImageUrl) {
    return {
      ok: false as const,
      error: 'Primary image URL must start with https://, http://, or /.',
    };
  }

  const gallery = uniqueUrls([primaryImageUrl, ...(input.galleryUrls ?? [])]);
  const now = new Date().toISOString();
  const primaryAltText = normalizeText(input.altText) ?? seed.title;

  const mediaMetadata = {
    imageAspect: input.imageAspect ?? defaultAspect(seed.kind),
    imageFit: input.imageFit ?? defaultFit(seed.kind),
    imagePosition: normalizeText(input.imagePosition),
    licenseType: normalizeText(input.licenseType),
    sourceLabel: normalizeText(input.sourceLabel),
    sourceUrl: normalizeUrl(input.sourceUrl),
    usageScope: normalizeText(input.usageScope) ?? 'storefront',
    notes: normalizeText(input.notes),
    lastSyncedAt: now,
    managedByAdminId: actor?.id ?? null,
    managedByLabel: actor?.name ?? null,
  } satisfies Record<string, unknown>;

  const { data: existingProduct, error: existingProductError } = await supabase
    .from('products')
    .select('id, metadata')
    .eq('id', seed.id)
    .maybeSingle();

  if (existingProductError) {
    return {
      ok: false as const,
      error: existingProductError.message,
    };
  }

  const existingMetadata = ((existingProduct as ExistingProductRow | null)?.metadata ?? {}) as Record<string, unknown>;
  const mergedMetadata = {
    ...existingMetadata,
    storefrontKind: seed.kind,
    fallbackImage: seed.image,
    mediaManaged: true,
    mediaLicenseType: mediaMetadata.licenseType,
    mediaSourceLabel: mediaMetadata.sourceLabel,
    mediaSourceUrl: mediaMetadata.sourceUrl,
    mediaUsageScope: mediaMetadata.usageScope,
    lastLicensedMediaSyncAt: now,
  };

  if (existingProduct) {
    const { error } = await supabase
      .from('products')
      .update({
        image_url: primaryImageUrl,
        metadata: mergedMetadata,
        updated_at: now,
      })
      .eq('id', seed.id);

    if (error) {
      return {
        ok: false as const,
        error: error.message,
      };
    }
  } else {
    const { error } = await supabase.from('products').insert({
      id: seed.id,
      title: seed.title,
      slug: slugify(seed.title),
      platform: seed.platform ?? null,
      image_url: primaryImageUrl,
      price_kes: seed.price,
      original_price_kes: seed.originalPrice ?? null,
      currency_code: 'KES',
      is_digital: seed.isDigital ?? false,
      metadata: mergedMetadata,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      return {
        ok: false as const,
        error: error.message,
      };
    }
  }

  const { error: deleteError } = await supabase.from('product_media').delete().eq('product_id', seed.id);
  if (deleteError) {
    return {
      ok: false as const,
      error: deleteError.message,
    };
  }

  if (gallery.length > 0) {
    const { error: insertError } = await supabase.from('product_media').insert(
      gallery.map((url, index) => ({
        product_id: seed.id,
        media_type: 'image',
        url,
        alt_text: primaryAltText,
        sort_order: index,
        metadata: {
          ...mediaMetadata,
          isPrimary: index === 0,
        },
        created_at: now,
        updated_at: now,
      }))
    );

    if (insertError) {
      return {
        ok: false as const,
        error: insertError.message,
      };
    }
  }

  return {
    ok: true as const,
    entry: await getEntryByProductId(seed.id),
  };
}

export async function clearCatalogMediaEntry(productId: string, actor?: ActorContext) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      ok: false as const,
      error: 'Supabase server credentials are not configured. Add them before removing catalog media.',
    };
  }

  const seed = getStorefrontSeedProductById(productId);
  if (!seed) {
    return {
      ok: false as const,
      error: `Unknown storefront product: ${productId}`,
    };
  }

  const now = new Date().toISOString();
  const { data: existingProduct } = await supabase
    .from('products')
    .select('id, metadata')
    .eq('id', seed.id)
    .maybeSingle();

  const { error: deleteError } = await supabase.from('product_media').delete().eq('product_id', seed.id);
  if (deleteError) {
    return {
      ok: false as const,
      error: deleteError.message,
    };
  }

  if (existingProduct) {
    const existingMetadata = ((existingProduct as ExistingProductRow | null)?.metadata ?? {}) as Record<string, unknown>;
    const { error: updateError } = await supabase
      .from('products')
      .update({
        image_url: null,
        metadata: {
          ...existingMetadata,
          storefrontKind: seed.kind,
          fallbackImage: seed.image,
          mediaManaged: true,
          mediaOverrideRemovedAt: now,
          lastLicensedMediaSyncAt: now,
          managedByAdminId: actor?.id ?? null,
          managedByLabel: actor?.name ?? null,
        },
        updated_at: now,
      })
      .eq('id', seed.id);

    if (updateError) {
      return {
        ok: false as const,
        error: updateError.message,
      };
    }
  }

  return {
    ok: true as const,
    entry: await getEntryByProductId(seed.id),
  };
}
