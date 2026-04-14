import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/admin-auth';
import { createAccessCodes, listAccessCodes } from '@/lib/iptv-codes';
import { IPTV_PLANS, type PlanId } from '@/domains/iptv/services/subscription-management';
import {
  recordAdminRequestAudit,
  requireAdminRequest,
} from '@/domains/admin/api/request-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, { notConfiguredMessage: 'Not configured' });
  if (!auth.ok) {
    return auth.response;
  }

  const adminId = isSuperAdmin(auth.context.current.admin)
    ? undefined
    : auth.context.current.admin.id;

  return NextResponse.json({ codes: await listAccessCodes(adminId) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req, { notConfiguredMessage: 'Not configured' });
  if (!auth.ok) {
    return auth.response;
  }

  const { planId, quantity = 1, note } = await req.json() as {
    planId: PlanId;
    quantity?: number;
    note?: string;
  };

  if (!planId || !IPTV_PLANS[planId]) {
    return NextResponse.json({ error: 'Invalid planId.' }, { status: 400 });
  }

  const qty = Math.max(1, Math.min(Number(quantity) || 1, 50));
  const plan = IPTV_PLANS[planId];
  const codes = await createAccessCodes({
    planId,
    planName: plan.name,
    quantity: qty,
    createdByAdminId: auth.context.current.admin.id,
    note,
  });

  await recordAdminRequestAudit(auth.context, {
    action: 'codes_generate',
    status: 'success',
    summary: `Generated ${qty} ${plan.name} access code(s).`,
    target: codes.map((code) => code.code).join(', '),
  });

  return NextResponse.json({ codes });
}
