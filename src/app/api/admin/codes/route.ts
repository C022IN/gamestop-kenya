import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  getAdminContextByToken,
  isAdminConfigured,
  isSuperAdmin,
  recordAdminAudit,
} from '@/lib/admin-auth';
import { createAccessCodes, listAccessCodes } from '@/lib/iptv-codes';
import { IPTV_PLANS, type PlanId } from '@/lib/iptv-subscriptions';

export const dynamic = 'force-dynamic';

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

async function getAuthorizedAdmin(req: NextRequest) {
  if (!(await isAdminConfigured())) return { error: 'Not configured', status: 503 as const };
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return { error: 'Unauthorized', status: 401 as const };
  const current = await getAdminContextByToken(token);
  if (!current) return { error: 'Unauthorized', status: 401 as const };
  return { current };
}

/** GET /api/admin/codes — list codes created by this admin (super sees all) */
export async function GET(req: NextRequest) {
  const auth = await getAuthorizedAdmin(req);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const adminId = isSuperAdmin(auth.current.admin) ? undefined : auth.current.admin.id;
  const codes = await listAccessCodes(adminId);
  return NextResponse.json({ codes });
}

/** POST /api/admin/codes — generate new access codes */
export async function POST(req: NextRequest) {
  const auth = await getAuthorizedAdmin(req);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

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
    createdByAdminId: auth.current.admin.id,
    note,
  });

  await recordAdminAudit({
    action: 'codes_generate',
    status: 'success',
    actorId: auth.current.admin.id,
    actorLabel: auth.current.admin.name,
    summary: `Generated ${qty} ${plan.name} access code(s).`,
    target: codes.map((c) => c.code).join(', '),
    ipAddress: getIp(req),
    userAgent: req.headers.get('user-agent'),
  });

  return NextResponse.json({ codes });
}
