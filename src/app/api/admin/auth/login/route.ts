import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  authenticateAdmin,
  createAdminSession,
  recordAdminAudit,
} from '@/lib/admin-auth';

function getRequestIp(req: NextRequest): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'identifier and password are required' }, { status: 400 });
    }

    const auth = await authenticateAdmin(identifier, password);

    if (!auth.ok || !auth.admin) {
      await recordAdminAudit({
        action: 'admin_sign_in',
        status: 'failed',
        actorId: null,
        actorLabel: String(identifier).trim() || 'Unknown',
        summary: auth.error ?? 'Failed admin sign-in attempt.',
        target: null,
        ipAddress: getRequestIp(req),
        userAgent: req.headers.get('user-agent'),
      });

      const status = auth.error?.includes('not configured') ? 503 : 401;
      return NextResponse.json({ error: auth.error ?? 'Invalid login details.' }, { status });
    }

    const session = await createAdminSession(auth.admin.id, {
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get('user-agent'),
    });

    await recordAdminAudit({
      action: 'admin_sign_in',
      status: 'success',
      actorId: auth.admin.id,
      actorLabel: auth.admin.name,
      summary: 'Signed in to the IPTV admin dashboard.',
      target: null,
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get('user-agent'),
    });

    const response = NextResponse.json({
      ok: true,
      admin: {
        id: auth.admin.id,
        role: auth.admin.role,
        name: auth.admin.name,
        email: auth.admin.email,
        phone: auth.admin.phone,
      },
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(session.expiresAt),
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
