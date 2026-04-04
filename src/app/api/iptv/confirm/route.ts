import { NextRequest, NextResponse } from 'next/server';
import { MOVIE_SESSION_COOKIE } from '@/lib/movie-platform';
import { confirmMpesaIptvCheckout } from '@/domains/iptv/services/mpesa-checkout-service';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await confirmMpesaIptvCheckout(String(body.checkoutRequestId ?? ''));

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.json({
    subscription: result.data.subscription,
    member: result.data.member,
  });

  if (result.data.movieSession) {
    response.cookies.set(MOVIE_SESSION_COOKIE, result.data.movieSession.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(result.data.movieSession.expiresAt),
    });
  }

  return response;
}
