import { NextRequest, NextResponse } from 'next/server';
import {
  createMovieSession,
  getProfileById,
  getProfileIdFromPhone,
  MOVIE_SESSION_COOKIE,
} from '@/lib/movie-platform';
import { normaliseMpesaPhone } from '@/lib/mpesa';
import {
  recordAdminRequestAudit,
  requireSuperAdminRequest,
} from '@/domains/admin/api/request-context';

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdminRequest(req, {
    notConfiguredMessage: 'Not configured',
    forbiddenMessage: 'Super admin only.',
  });
  if (!auth.ok) {
    return auth.response;
  }

  const { phone: rawPhone } = await req.json() as { phone: string };
  if (!rawPhone) {
    return NextResponse.json({ error: 'phone is required.' }, { status: 400 });
  }

  const phone = normaliseMpesaPhone(rawPhone);
  const profileId = getProfileIdFromPhone(phone);
  const profile = await getProfileById(profileId);

  if (!profile) {
    return NextResponse.json(
      { error: 'No member profile found for that phone number. Grant access first.' },
      { status: 404 }
    );
  }

  const session = await createMovieSession(profileId);
  if (!session) {
    return NextResponse.json({ error: 'Could not create session.' }, { status: 500 });
  }

  await recordAdminRequestAudit(auth.context, {
    action: 'member_impersonate',
    status: 'success',
    summary: `Impersonated member ${profileId} (${phone}).`,
    target: profileId,
  });

  const response = NextResponse.json({
    profileId: profile.profileId,
    phone: profile.phone,
    accessCode: profile.accessCode,
    sessionToken: session.token,
    expiresAt: session.expiresAt,
    loginUrl: '/movies',
  });

  response.cookies.set(MOVIE_SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(session.expiresAt),
  });

  return response;
}
