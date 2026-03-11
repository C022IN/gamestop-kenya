import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  getAdminContextByToken,
  isAdminConfigured,
  isSuperAdmin,
  recordAdminAudit,
} from '@/lib/admin-auth';
import {
  getProfileIdFromPhone,
  getProfileById,
  createMovieSession,
  MOVIE_SESSION_COOKIE,
} from '@/lib/movie-platform';
import { normaliseMpesaPhone } from '@/lib/mpesa';

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

async function getAuthorizedAdmin(req: NextRequest) {
  if (!isAdminConfigured()) return { error: 'Not configured', status: 503 as const };
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return { error: 'Unauthorized', status: 401 as const };
  const current = await getAdminContextByToken(token);
  if (!current) return { error: 'Unauthorized', status: 401 as const };
  return { current };
}

/**
 * POST /api/admin/impersonate
 * Body: { phone }
 *
 * Generates a member session for any phone number.
 * Returns the session token + member credentials so the admin
 * can log in as that user. Super-admin only.
 *
 * The response also sets the gsm_movie_session cookie so hitting
 * /movies after this call logs the admin in as that member.
 */
export async function POST(req: NextRequest) {
  const auth = await getAuthorizedAdmin(req);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!isSuperAdmin(auth.current.admin)) {
    return NextResponse.json({ error: 'Super admin only.' }, { status: 403 });
  }

  const { phone: rawPhone } = await req.json() as { phone: string };
  if (!rawPhone) return NextResponse.json({ error: 'phone is required.' }, { status: 400 });

  const phone = normaliseMpesaPhone(rawPhone);
  const profileId = getProfileIdFromPhone(phone);
  const profile = await getProfileById(profileId);

  if (!profile) {
    return NextResponse.json({ error: 'No member profile found for that phone number. Grant access first.' }, { status: 404 });
  }

  const session = await createMovieSession(profileId);
  if (!session) {
    return NextResponse.json({ error: 'Could not create session.' }, { status: 500 });
  }

  await recordAdminAudit({
    action: 'member_impersonate',
    status: 'success',
    actorId: auth.current.admin.id,
    actorLabel: auth.current.admin.name,
    summary: `Impersonated member ${profileId} (${phone}).`,
    target: profileId,
    ipAddress: getIp(req),
    userAgent: req.headers.get('user-agent'),
  });

  const response = NextResponse.json({
    profileId: profile.profileId,
    phone: profile.phone,
    accessCode: profile.accessCode,
    sessionToken: session.token,
    expiresAt: session.expiresAt,
    loginUrl: '/movies',
  });

  // Set the session cookie so the browser is immediately logged in as the member
  response.cookies.set(MOVIE_SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(session.expiresAt),
  });

  return response;
}
