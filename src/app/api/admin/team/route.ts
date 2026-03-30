import { NextRequest, NextResponse } from 'next/server';
import {
  createStaffAdmin,
  getAdminAuditTrail,
  listAdmins,
} from '@/lib/admin-auth';
import { getAllSubscriptions } from '@/lib/iptv-subscriptions';
import {
  recordAdminRequestAudit,
  requireSuperAdminRequest,
} from '@/domains/admin/api/request-context';
import { buildSubscriptionBundles } from '@/domains/admin/services/subscription-bundles';

export const dynamic = 'force-dynamic';

async function buildTeamSnapshot() {
  const [subscriptions, admins] = await Promise.all([getAllSubscriptions(), listAdmins()]);

  return admins.map((admin) => {
    const owned = subscriptions.filter((subscription) => subscription.assignedAdminId === admin.id);
    const bundles = buildSubscriptionBundles(owned);
    return {
      ...admin,
      onboardedUsers: bundles.length,
      activeUsers: bundles.filter((bundle) => bundle.status === 'active').length,
      pendingUsers: bundles.filter((bundle) => bundle.status === 'pending').length,
    };
  });
}

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdminRequest(req, {
    forbiddenMessage: 'Only the super admin can view the full admin team.',
  });
  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json({
    admins: await buildTeamSnapshot(),
    auditTrail: await getAdminAuditTrail(20),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdminRequest(req, {
    forbiddenMessage: 'Only the super admin can create other admins.',
  });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { name, phone, email, password } = await req.json();
    const result = await createStaffAdmin({
      name: String(name ?? ''),
      phone: typeof phone === 'string' ? phone : null,
      email: String(email ?? ''),
      password: String(password ?? ''),
      createdByAdminId: auth.context.current.admin.id,
    });

    if (!result.ok || !result.admin) {
      await recordAdminRequestAudit(auth.context, {
        action: 'admin_create',
        status: 'failed',
        summary: result.error ?? 'Failed to create admin.',
        target: typeof email === 'string' ? email : null,
      });

      return NextResponse.json({ error: result.error ?? 'Could not create admin.' }, { status: 400 });
    }

    await recordAdminRequestAudit(auth.context, {
      action: 'admin_create',
      status: 'success',
      summary: `Created admin ${result.admin.name}.`,
      target: result.admin.id,
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
