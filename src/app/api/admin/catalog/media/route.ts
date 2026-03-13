import { NextRequest, NextResponse } from 'next/server';
import {
  clearCatalogMediaEntry,
  hasCatalogMediaPersistence,
  listCatalogMediaEntries,
  upsertCatalogMediaEntry,
} from '@/lib/catalog-media-admin';
import {
  ADMIN_SESSION_COOKIE,
  getAdminContextByToken,
  isAdminConfigured,
  recordAdminAudit,
} from '@/lib/admin-auth';
import type { StorefrontKind } from '@/lib/storefront-types';

export const dynamic = 'force-dynamic';

function getRequestIp(req: NextRequest): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

async function getAuthorizedAdmin(req: NextRequest) {
  if (!(await isAdminConfigured())) {
    return { error: 'Admin login is not configured yet.', status: 503 as const };
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return { error: 'Unauthorized', status: 401 as const };
  }

  const current = await getAdminContextByToken(token);
  if (!current) {
    return { error: 'Unauthorized', status: 401 as const };
  }

  return { current };
}

function parseKind(value: string | null): StorefrontKind | undefined {
  if (value === 'games' || value === 'gift-cards' || value === 'hardware') {
    return value;
  }

  return undefined;
}

export async function GET(req: NextRequest) {
  const auth = await getAuthorizedAdmin(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const kind = parseKind(req.nextUrl.searchParams.get('kind'));

  return NextResponse.json({
    hasSupabase: hasCatalogMediaPersistence(),
    currentAdmin: {
      id: auth.current.admin.id,
      role: auth.current.admin.role,
      name: auth.current.admin.name,
      email: auth.current.admin.email,
      phone: auth.current.admin.phone,
    },
    products: await listCatalogMediaEntries(kind),
  });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthorizedAdmin(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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
        id: auth.current.admin.id,
        name: auth.current.admin.name,
      }
    );

    if (!result.ok) {
      await recordAdminAudit({
        action: 'catalog_media_upsert',
        status: 'failed',
        actorId: auth.current.admin.id,
        actorLabel: auth.current.admin.name,
        summary: result.error,
        target: typeof body.productId === 'string' ? body.productId : null,
        ipAddress: getRequestIp(req),
        userAgent: req.headers.get('user-agent'),
      });

      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await recordAdminAudit({
      action: 'catalog_media_upsert',
      status: 'success',
      actorId: auth.current.admin.id,
      actorLabel: auth.current.admin.name,
      summary: `Updated licensed media for ${result.entry?.title ?? body.productId}.`,
      target: result.entry?.id ?? (typeof body.productId === 'string' ? body.productId : null),
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get('user-agent'),
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
  const auth = await getAuthorizedAdmin(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const productId = String(body.productId ?? '');
    const result = await clearCatalogMediaEntry(productId, {
      id: auth.current.admin.id,
      name: auth.current.admin.name,
    });

    if (!result.ok) {
      await recordAdminAudit({
        action: 'catalog_media_clear',
        status: 'failed',
        actorId: auth.current.admin.id,
        actorLabel: auth.current.admin.name,
        summary: result.error,
        target: productId || null,
        ipAddress: getRequestIp(req),
        userAgent: req.headers.get('user-agent'),
      });

      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await recordAdminAudit({
      action: 'catalog_media_clear',
      status: 'success',
      actorId: auth.current.admin.id,
      actorLabel: auth.current.admin.name,
      summary: `Cleared licensed media overrides for ${result.entry?.title ?? productId}.`,
      target: result.entry?.id ?? productId,
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get('user-agent'),
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
