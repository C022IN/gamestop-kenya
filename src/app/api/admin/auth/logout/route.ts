import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { getAdminRequestMetadata } from '@/domains/admin/api/request-context';
import { signOutAdminSession } from '@/domains/admin/services/session-service';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  await signOutAdminSession(token, getAdminRequestMetadata(req));

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
