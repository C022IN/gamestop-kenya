import { NextRequest, NextResponse } from 'next/server';
import {
  createMovieSession,
  getProfileByAccessCode,
  MOVIE_SESSION_COOKIE,
} from '@/lib/movie-platform';
import { verifyTurnstileRequest } from '@/lib/turnstile';

function isKodiClient(req: NextRequest) {
  const userAgent = req.headers.get('user-agent')?.toLowerCase() ?? '';
  return userAgent.includes('kodi/gamestopkenya');
}

export async function POST(req: NextRequest) {
  try {
    let body: { phone?: unknown; accessCode?: unknown; turnstileToken?: unknown };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { phone, accessCode } = body;

    if (!phone || !accessCode) {
      return NextResponse.json({ error: 'phone and accessCode are required' }, { status: 400 });
    }

    if (!isKodiClient(req)) {
      const verification = await verifyTurnstileRequest(req, body.turnstileToken);
      if (!verification.ok) {
        return NextResponse.json({ error: verification.error }, { status: verification.status });
      }
    }

    const profile = await getProfileByAccessCode(String(phone), String(accessCode));
    if (!profile) {
      return NextResponse.json({ error: 'Invalid phone or access code' }, { status: 401 });
    }

    const session = await createMovieSession(profile.profileId);
    if (!session) {
      return NextResponse.json({ error: 'Could not create session' }, { status: 500 });
    }

    const response = NextResponse.json({
      profile: {
        profileId: profile.profileId,
        phone: profile.phone,
      },
    });

    response.cookies.set(MOVIE_SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(session.expiresAt),
    });

    return response;
  } catch (err) {
    console.error('Movie login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
