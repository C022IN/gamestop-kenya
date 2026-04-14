import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/admin-auth';
import {
  requireAdminRequest,
  recordAdminRequestAudit,
} from '@/domains/admin/api/request-context';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: Promise<{ id: string }>;
}

interface SeoInput {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  ogImage?: string;
  canonicalSlug?: string;
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const next = value.trim();
  return next || undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && isFinite(value) && value >= 0) return value;
  return undefined;
}

function normalizeBool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  return undefined;
}

function normalizeSeo(value: unknown): SeoInput | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const obj = value as Record<string, unknown>;
  return {
    metaTitle: normalizeText(obj.metaTitle),
    metaDescription: normalizeText(obj.metaDescription),
    keywords: normalizeText(obj.keywords),
    ogImage: normalizeText(obj.ogImage),
    canonicalSlug: normalizeText(obj.canonicalSlug),
  };
}

export async function PUT(req: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const auth = await requireAdminRequest(req);
  if (!auth.ok) return auth.response;

  const { admin } = auth.context.current;
  const superAdmin = isSuperAdmin(admin);

  // Catalog admins and super admins can update products
  if (!superAdmin && admin.adminType !== 'catalog') {
    return NextResponse.json({ error: 'Catalog admin access only.' }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }

  try {
    const body = await req.json();

    const title = normalizeText(body.title);
    const description = normalizeText(body.description);
    const platform = normalizeText(body.platform);
    const priceKes = normalizeNumber(body.priceKes);
    const originalPriceKes = 'originalPriceKes' in body
      ? (typeof body.originalPriceKes === 'number' ? body.originalPriceKes : null)
      : undefined;
    const inStock = normalizeBool(body.inStock);
    const stockQuantity = 'stockQuantity' in body
      ? (typeof body.stockQuantity === 'number' ? Math.round(body.stockQuantity) : null)
      : undefined;
    const seo = normalizeSeo(body.seo);

    // Load existing product to merge metadata
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('id, metadata')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    if (!existing) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const existingMetadata = (existing?.metadata as Record<string, unknown> | null) ?? {};
    const existingSeo = (existingMetadata.seo as Record<string, unknown> | null) ?? {};
    const mergedSeo = seo
      ? {
          ...existingSeo,
          ...(seo.metaTitle !== undefined && { metaTitle: seo.metaTitle }),
          ...(seo.metaDescription !== undefined && { metaDescription: seo.metaDescription }),
          ...(seo.keywords !== undefined && { keywords: seo.keywords }),
          ...(seo.ogImage !== undefined && { ogImage: seo.ogImage }),
          ...(seo.canonicalSlug !== undefined && { canonicalSlug: seo.canonicalSlug }),
        }
      : existingSeo;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      metadata: { ...existingMetadata, seo: mergedSeo },
    };

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (platform !== undefined) updates.platform = platform;
    if (priceKes !== undefined) updates.price_kes = priceKes;
    if (originalPriceKes !== undefined) updates.original_price_kes = originalPriceKes;
    if (inStock !== undefined) updates.in_stock = inStock;
    if (stockQuantity !== undefined) updates.stock_quantity = stockQuantity;

    const { error: updateError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    await recordAdminRequestAudit(auth.context, {
      action: 'catalog_product_update',
      status: 'success',
      summary: `Updated product ${id}${title ? ` — "${title}"` : ''}.`,
      target: id,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
