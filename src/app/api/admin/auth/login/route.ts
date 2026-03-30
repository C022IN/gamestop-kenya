import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { getAdminRequestMetadata } from '@/domains/admin/api/request-context';
import { signInAdminSession } from '@/domains/admin/services/session-service';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    const signIn = await signInAdminSession({
      email: String(email),
      password: String(password),
      metadata: getAdminRequestMetadata(req),
    });

    if (!signIn.ok) {
      return NextResponse.json({ error: signIn.error }, { status: signIn.status });
    }

    const response = NextResponse.json({
      ok: true,
      admin: {
        id: signIn.admin.id,
        role: signIn.admin.role,
        name: signIn.admin.name,
        email: signIn.admin.email,
        phone: signIn.admin.phone,
      },
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, signIn.session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(signIn.session.expiresAt),
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
