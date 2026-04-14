import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/admin-auth';
import {
  requireAdminRequest,
  recordAdminRequestAudit,
} from '@/domains/admin/api/request-context';
import {
  updateListing,
  deleteListing,
  type ListingCondition,
} from '@/domains/admin/services/catalog-listings-service';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) return auth.response;

  const { admin } = auth.context.current;
  const superAdmin = isSuperAdmin(admin);

  if (!superAdmin && admin.adminType !== 'catalog') {
    return NextResponse.json({ error: 'Catalog admin access only.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, category, priceKes, images, specs, condition, isAvailable } = body;

    const result = await updateListing(params.id, admin.id, superAdmin, {
      title: typeof title === 'string' ? title : undefined,
      description: typeof description === 'string' ? description : undefined,
      category: typeof category === 'string' ? category : undefined,
      priceKes: 'priceKes' in body ? (typeof priceKes === 'number' ? priceKes : null) : undefined,
      images: Array.isArray(images) ? images.map(String) : undefined,
      specs: specs && typeof specs === 'object' ? (specs as Record<string, string>) : undefined,
      condition: (['new', 'used', 'refurbished'] as ListingCondition[]).includes(condition)
        ? condition
        : undefined,
      isAvailable: typeof isAvailable === 'boolean' ? isAvailable : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await recordAdminRequestAudit(auth.context, {
      action: 'catalog_listing_update',
      status: 'success',
      summary: `Updated listing ${params.id}.`,
      target: params.id,
    });

    return NextResponse.json({ listing: result.listing });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) return auth.response;

  const { admin } = auth.context.current;
  const superAdmin = isSuperAdmin(admin);

  if (!superAdmin && admin.adminType !== 'catalog') {
    return NextResponse.json({ error: 'Catalog admin access only.' }, { status: 403 });
  }

  const result = await deleteListing(params.id, admin.id, superAdmin);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await recordAdminRequestAudit(auth.context, {
    action: 'catalog_listing_delete',
    status: 'success',
    summary: `Deleted listing ${params.id}.`,
    target: params.id,
  });

  return NextResponse.json({ ok: true });
}
