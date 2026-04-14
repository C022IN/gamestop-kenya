import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/admin-auth';
import {
  requireAdminRequest,
  recordAdminRequestAudit,
} from '@/domains/admin/api/request-context';
import {
  getListingsForAdmin,
  createListing,
  type ListingCondition,
} from '@/domains/admin/services/catalog-listings-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) return auth.response;

  const { admin } = auth.context.current;
  const superAdmin = isSuperAdmin(admin);

  if (!superAdmin && admin.adminType !== 'catalog') {
    return NextResponse.json({ error: 'Catalog admin access only.' }, { status: 403 });
  }

  const listings = await getListingsForAdmin(admin.id, superAdmin);
  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) return auth.response;

  const { admin } = auth.context.current;
  const superAdmin = isSuperAdmin(admin);

  if (!superAdmin && admin.adminType !== 'catalog') {
    return NextResponse.json({ error: 'Catalog admin access only.' }, { status: 403 });
  }

  try {
    const { title, description, category, priceKes, images, specs, condition } = await req.json();

    const result = await createListing({
      adminId: admin.id,
      title: String(title ?? ''),
      description: typeof description === 'string' ? description : undefined,
      category: typeof category === 'string' ? category : undefined,
      priceKes: typeof priceKes === 'number' ? priceKes : null,
      images: Array.isArray(images) ? images.map(String) : [],
      specs: specs && typeof specs === 'object' ? (specs as Record<string, string>) : {},
      condition: (['new', 'used', 'refurbished'] as ListingCondition[]).includes(condition)
        ? condition
        : 'new',
    });

    if (!result.ok) {
      await recordAdminRequestAudit(auth.context, {
        action: 'catalog_listing_create',
        status: 'failed',
        summary: result.error ?? 'Failed to create listing.',
        target: null,
      });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await recordAdminRequestAudit(auth.context, {
      action: 'catalog_listing_create',
      status: 'success',
      summary: `Created listing "${result.listing!.title}".`,
      target: result.listing!.id,
    });

    return NextResponse.json({ listing: result.listing });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
