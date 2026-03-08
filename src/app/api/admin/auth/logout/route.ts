import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  destroyAdminSession,
  getAdminContextByToken,
  recordAdminAudit,
} from '@/lib/admin-auth';

function getRequestIp(req: NextRequest): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
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
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get('user-agent'),
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}
