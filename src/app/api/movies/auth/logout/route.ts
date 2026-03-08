import { NextRequest, NextResponse } from 'next/server';
import { destroyMovieSession, MOVIE_SESSION_COOKIE } from '@/lib/movie-platform';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  if (token) {
    await destroyMovieSession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(MOVIE_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
  return response;
}
