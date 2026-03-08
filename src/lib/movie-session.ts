import { cookies } from 'next/headers';
import { getProfileById, getSessionByToken, MOVIE_SESSION_COOKIE } from '@/lib/movie-platform';

export async function getCurrentMovieMember() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MOVIE_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await getSessionByToken(token);
  if (!session) return null;

  const profile = await getProfileById(session.profileId);
  if (!profile) return null;

  return { session, profile };
}
