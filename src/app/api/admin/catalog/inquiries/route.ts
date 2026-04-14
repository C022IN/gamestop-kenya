import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/admin-auth';
import { requireAdminRequest } from '@/domains/admin/api/request-context';
import { getInquiriesForAdmin } from '@/domains/admin/services/catalog-listings-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) return auth.response;

  const { admin } = auth.context.current;
  const superAdmin = isSuperAdmin(admin);

  if (!superAdmin && admin.adminType !== 'catalog') {
    return NextResponse.json({ error: 'Catalog admin access only.' }, { status: 403 });
  }

  const inquiries = await getInquiriesForAdmin(admin.id, superAdmin);
  return NextResponse.json({ inquiries });
}
