import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  createStaffAdmin,
  getAdminContextByToken,
  getAdminAuditTrail,
  isAdminConfigured,
  isSuperAdmin,
  listAdmins,
  recordAdminAudit,
} from '@/lib/admin-auth';
import { getAllSubscriptions } from '@/lib/iptv-subscriptions';

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

async function buildTeamSnapshot() {
  const [subscriptions, admins] = await Promise.all([getAllSubscriptions(), listAdmins()]);

  return admins.map((admin) => {
    const owned = subscriptions.filter((subscription) => subscription.assignedAdminId === admin.id);
    return {
      ...admin,
      onboardedUsers: owned.length,
      activeUsers: owned.filter((subscription) => subscription.status === 'active').length,
      pendingUsers: owned.filter((subscription) => subscription.status === 'pending').length,
    };
  });
}

export async function GET(req: NextRequest) {
  const auth = await getAuthorizedAdmin(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isSuperAdmin(auth.current.admin)) {
    return NextResponse.json({ error: 'Only the super admin can view the full admin team.' }, { status: 403 });
  }

  return NextResponse.json({
    admins: await buildTeamSnapshot(),
    auditTrail: await getAdminAuditTrail(20),
  });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthorizedAdmin(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isSuperAdmin(auth.current.admin)) {
    return NextResponse.json({ error: 'Only the super admin can create other admins.' }, { status: 403 });
  }

  try {
    const { name, phone, email, password } = await req.json();
    const result = await createStaffAdmin({
      name: String(name ?? ''),
      phone: typeof phone === 'string' ? phone : null,
      email: String(email ?? ''),
      password: String(password ?? ''),
      createdByAdminId: auth.current.admin.id,
    });

    if (!result.ok || !result.admin) {
      await recordAdminAudit({
        action: 'admin_create',
        status: 'failed',
        actorId: auth.current.admin.id,
        actorLabel: auth.current.admin.name,
        summary: result.error ?? 'Failed to create admin.',
        target: typeof email === 'string' ? email : null,
        ipAddress: getRequestIp(req),
        userAgent: req.headers.get('user-agent'),
      });

      return NextResponse.json({ error: result.error ?? 'Could not create admin.' }, { status: 400 });
    }

    await recordAdminAudit({
      action: 'admin_create',
      status: 'success',
      actorId: auth.current.admin.id,
      actorLabel: auth.current.admin.name,
      summary: `Created admin ${result.admin.name}.`,
      target: result.admin.id,
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      admin: result.admin,
      admins: await buildTeamSnapshot(),
      auditTrail: await getAdminAuditTrail(20),
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
