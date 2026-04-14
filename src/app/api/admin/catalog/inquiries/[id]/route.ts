import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/admin-auth';
import {
  requireAdminRequest,
  recordAdminRequestAudit,
} from '@/domains/admin/api/request-context';
import {
  updateInquiryStatus,
  type InquiryStatus,
} from '@/domains/admin/services/catalog-listings-service';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const auth = await requireAdminRequest(req);
  if (!auth.ok) return auth.response;

  const { admin } = auth.context.current;
  const superAdmin = isSuperAdmin(admin);

  if (!superAdmin && admin.adminType !== 'catalog') {
    return NextResponse.json({ error: 'Catalog admin access only.' }, { status: 403 });
  }

  try {
    const { status, adminNotes } = await req.json();

    const validStatuses: InquiryStatus[] = ['new', 'contacted', 'sold', 'closed'];
    const result = await updateInquiryStatus(id, admin.id, superAdmin, {
      status: validStatuses.includes(status) ? status : undefined,
      adminNotes: typeof adminNotes === 'string' ? adminNotes : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await recordAdminRequestAudit(auth.context, {
      action: 'catalog_inquiry_update',
      status: 'success',
      summary: `Updated inquiry ${id} to status "${status}".`,
      target: id,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
