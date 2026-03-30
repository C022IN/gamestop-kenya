import { NextRequest, NextResponse } from 'next/server';
import {
  clearCatalogMediaEntry,
  hasCatalogMediaPersistence,
  listCatalogMediaEntries,
  upsertCatalogMediaEntry,
} from '@/lib/catalog-media-admin';
import type { StorefrontKind } from '@/lib/storefront-types';
import {
  recordAdminRequestAudit,
  requireAdminRequest,
} from '@/domains/admin/api/request-context';

export const dynamic = 'force-dynamic';

function parseKind(value: string | null): StorefrontKind | undefined {
  if (value === 'games' || value === 'gift-cards' || value === 'hardware') {
    return value;
  }

  return undefined;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  const kind = parseKind(req.nextUrl.searchParams.get('kind'));

  return NextResponse.json({
    hasSupabase: hasCatalogMediaPersistence(),
    currentAdmin: {
      id: auth.context.current.admin.id,
      role: auth.context.current.admin.role,
      name: auth.context.current.admin.name,
      email: auth.context.current.admin.email,
      phone: auth.context.current.admin.phone,
    },
    products: await listCatalogMediaEntries(kind),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const result = await upsertCatalogMediaEntry(
      {
        productId: String(body.productId ?? ''),
        primaryImageUrl: String(body.primaryImageUrl ?? ''),
        galleryUrls: Array.isArray(body.galleryUrls)
          ? body.galleryUrls.map((value: unknown) => String(value))
          : [],
        altText: typeof body.altText === 'string' ? body.altText : undefined,
        imageAspect:
          body.imageAspect === 'portrait' || body.imageAspect === 'card' || body.imageAspect === 'wide'
            ? body.imageAspect
            : undefined,
        imageFit: body.imageFit === 'cover' || body.imageFit === 'contain' ? body.imageFit : undefined,
        imagePosition: typeof body.imagePosition === 'string' ? body.imagePosition : undefined,
        licenseType: typeof body.licenseType === 'string' ? body.licenseType : undefined,
        sourceLabel: typeof body.sourceLabel === 'string' ? body.sourceLabel : undefined,
        sourceUrl: typeof body.sourceUrl === 'string' ? body.sourceUrl : undefined,
        usageScope: typeof body.usageScope === 'string' ? body.usageScope : undefined,
        notes: typeof body.notes === 'string' ? body.notes : undefined,
      },
      {
        id: auth.context.current.admin.id,
        name: auth.context.current.admin.name,
      }
    );

    if (!result.ok) {
      await recordAdminRequestAudit(auth.context, {
        action: 'catalog_media_upsert',
        status: 'failed',
        summary: result.error,
        target: typeof body.productId === 'string' ? body.productId : null,
      });

      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await recordAdminRequestAudit(auth.context, {
      action: 'catalog_media_upsert',
      status: 'success',
      summary: `Updated licensed media for ${result.entry?.title ?? body.productId}.`,
      target: result.entry?.id ?? (typeof body.productId === 'string' ? body.productId : null),
    });

    return NextResponse.json({
      hasSupabase: hasCatalogMediaPersistence(),
      product: result.entry,
      products: await listCatalogMediaEntries(parseKind(body.kind ?? null)),
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const productId = String(body.productId ?? '');
    const result = await clearCatalogMediaEntry(productId, {
      id: auth.context.current.admin.id,
      name: auth.context.current.admin.name,
    });

    if (!result.ok) {
      await recordAdminRequestAudit(auth.context, {
        action: 'catalog_media_clear',
        status: 'failed',
        summary: result.error,
        target: productId || null,
      });

      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await recordAdminRequestAudit(auth.context, {
      action: 'catalog_media_clear',
      status: 'success',
      summary: `Cleared licensed media overrides for ${result.entry?.title ?? productId}.`,
      target: result.entry?.id ?? productId,
    });

    return NextResponse.json({
      hasSupabase: hasCatalogMediaPersistence(),
      product: result.entry,
      products: await listCatalogMediaEntries(),
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
