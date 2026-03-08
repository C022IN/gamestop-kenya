import { NextRequest, NextResponse } from 'next/server';
import {
  createMovieSession,
  getProfileByAccessCode,
  MOVIE_SESSION_COOKIE,
} from '@/lib/movie-platform';

export async function POST(req: NextRequest) {
  try {
    const { phone, accessCode } = await req.json();

    if (!phone || !accessCode) {
      return NextResponse.json({ error: 'phone and accessCode are required' }, { status: 400 });
    }

    const profile = getProfileByAccessCode(String(phone), String(accessCode));
    if (!profile) {
      return NextResponse.json({ error: 'Invalid phone or access code' }, { status: 401 });
    }

    const session = createMovieSession(profile.profileId);
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
      path: '/',
      expires: new Date(session.expiresAt),
    });

    return response;
  } catch (err) {
    console.error('Movie login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
