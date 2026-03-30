import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  getAdminContextByToken,
  isAdminConfigured,
  isSuperAdmin,
  recordAdminAudit,
  type AdminAuditEntry,
} from '@/lib/admin-auth';

export interface AdminRequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

type CurrentAdminContext = NonNullable<Awaited<ReturnType<typeof getAdminContextByToken>>>;

export interface AdminRequestContext {
  token: string;
  current: CurrentAdminContext;
  metadata: AdminRequestMetadata;
}

type AuthorizedAdminResult =
  | { ok: true; context: AdminRequestContext }
  | { ok: false; response: NextResponse };

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status });
}

export function getAdminRequestMetadata(req: NextRequest): AdminRequestMetadata {
  return {
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: req.headers.get('user-agent'),
  };
}

export async function requireAdminRequest(
  req: NextRequest,
  options?: { notConfiguredMessage?: string }
): Promise<AuthorizedAdminResult> {
  if (!(await isAdminConfigured())) {
    return {
      ok: false,
      response: jsonError(
        options?.notConfiguredMessage ?? 'Admin login is not configured yet.',
        503
      ),
    };
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return { ok: false, response: jsonError('Unauthorized', 401) };
  }

  const current = await getAdminContextByToken(token);
  if (!current) {
    return { ok: false, response: jsonError('Unauthorized', 401) };
  }

  return {
    ok: true,
    context: {
      token,
      current,
      metadata: getAdminRequestMetadata(req),
    },
  };
}

export async function requireSuperAdminRequest(
  req: NextRequest,
  options?: {
    notConfiguredMessage?: string;
    forbiddenMessage?: string;
  }
): Promise<AuthorizedAdminResult> {
  const auth = await requireAdminRequest(req, {
    notConfiguredMessage: options?.notConfiguredMessage,
  });

  if (!auth.ok) {
    return auth;
  }

  if (!isSuperAdmin(auth.context.current.admin)) {
    return {
      ok: false,
      response: jsonError(options?.forbiddenMessage ?? 'Super admin only.', 403),
    };
  }

  return auth;
}

export async function recordAdminRequestAudit(
  context: Pick<AdminRequestContext, 'current' | 'metadata'>,
  entry: Pick<AdminAuditEntry, 'action' | 'status' | 'summary' | 'target'>
) {
  await recordAdminAudit({
    ...entry,
    actorId: context.current.admin.id,
    actorLabel: context.current.admin.name,
    ipAddress: context.metadata.ipAddress,
    userAgent: context.metadata.userAgent,
  });
}
