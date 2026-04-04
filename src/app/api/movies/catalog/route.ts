import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionByToken,
  getAccessibleContentForProfile,
  MOVIE_SESSION_COOKIE,
} from '@/lib/movie-platform';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(MOVIE_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const session = await getSessionByToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  const items = await getAccessibleContentForProfile(session.profileId);

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      overview: item.synopsis,
      genres: item.genres,
      year: item.year,
      duration_minutes: item.durationMinutes,
      maturity_rating: item.maturityRating,
    })),
  });
}
