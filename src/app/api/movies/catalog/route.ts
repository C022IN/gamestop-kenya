import { NextRequest, NextResponse } from 'next/server';
import {
  buildPlaybackSource,
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
  const playbackCandidates = await Promise.all(
    items.map(async (item) => ({
      item,
      playback: await buildPlaybackSource(item),
    }))
  );
  const playableItems = playbackCandidates
    .filter((entry) => Boolean(entry.playback))
    .map((entry) => entry.item);

  return NextResponse.json({
    items: playableItems.map((item) => ({
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
