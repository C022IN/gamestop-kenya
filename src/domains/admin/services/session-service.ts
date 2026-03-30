import {
  authenticateAdmin,
  createAdminSession,
  destroyAdminSession,
  getAdminContextByToken,
  recordAdminAudit,
  type AdminIdentity,
  type AdminSession,
} from '@/lib/admin-auth';
import type { AdminRequestMetadata } from '@/domains/admin/api/request-context';

type AdminSignInResult =
  | {
      ok: true;
      admin: AdminIdentity;
      session: AdminSession;
    }
  | {
      ok: false;
      error: string;
      status: 401 | 503;
    };

export async function signInAdminSession(params: {
  email: string;
  password: string;
  metadata: AdminRequestMetadata;
}): Promise<AdminSignInResult> {
  const auth = await authenticateAdmin(params.email, params.password);

  if (!auth.ok || !auth.admin) {
    const error = auth.error ?? 'Invalid login details.';

    await recordAdminAudit({
      action: 'admin_sign_in',
      status: 'failed',
      actorId: null,
      actorLabel: params.email.trim() || 'Unknown',
      summary: error,
      target: null,
      ipAddress: params.metadata.ipAddress,
      userAgent: params.metadata.userAgent,
    });

    return {
      ok: false,
      error,
      status: error.includes('not configured') ? 503 : 401,
    };
  }

  const session = await createAdminSession(auth.admin.id, {
    ipAddress: params.metadata.ipAddress,
    userAgent: params.metadata.userAgent,
  });

  await recordAdminAudit({
    action: 'admin_sign_in',
    status: 'success',
    actorId: auth.admin.id,
    actorLabel: auth.admin.name,
    summary: 'Signed in to the IPTV admin dashboard.',
    target: null,
    ipAddress: params.metadata.ipAddress,
    userAgent: params.metadata.userAgent,
  });

  return { ok: true, admin: auth.admin, session };
}

export async function signOutAdminSession(
  token: string | undefined,
  metadata: AdminRequestMetadata
) {
  const current = token ? await getAdminContextByToken(token) : null;

  if (token) {
    await destroyAdminSession(token);
  }

  if (current) {
    await recordAdminAudit({
      action: 'admin_sign_out',
      status: 'success',
      actorId: current.admin.id,
      actorLabel: current.admin.name,
      summary: 'Signed out of the IPTV admin dashboard.',
      target: null,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
  }

  return { current };
}
