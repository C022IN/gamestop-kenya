import {
  buildPlaybackSource,
  getAccessibleContentForProfile,
  getSessionByToken,
  MOVIE_SESSION_COOKIE,
} from '@/lib/movie-platform';

export { MOVIE_SESSION_COOKIE };

type ServiceError = { ok: false; error: string; status: number };
type ServiceSuccess<T> = { ok: true; data: T };
type ServiceResult<T> = ServiceError | ServiceSuccess<T>;

export interface CatalogItem {
  id: string;
  slug: string;
  title: string;
  overview: string | undefined;
  genres: string[] | undefined;
  year: number | undefined;
  duration_minutes: number | undefined;
  maturity_rating: string | undefined;
}

export interface CatalogResult {
  items: CatalogItem[];
}

export async function getCatalogForSession(
  token: string | undefined
): Promise<ServiceResult<CatalogResult>> {
  if (!token) {
    return { ok: false, error: 'Unauthorised', status: 401 };
  }

  const session = await getSessionByToken(token);
  if (!session) {
    return { ok: false, error: 'Session expired', status: 401 };
  }

  const rawItems = await getAccessibleContentForProfile(session.profileId);
  const candidates = await Promise.all(
    rawItems.map(async (item) => ({
      item,
      playback: await buildPlaybackSource(item),
    }))
  );

  const items: CatalogItem[] = candidates
    .filter((entry) => Boolean(entry.playback))
    .map(({ item }) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      overview: item.synopsis,
      genres: item.genres,
      year: item.year,
      duration_minutes: item.durationMinutes,
      maturity_rating: item.maturityRating,
    }));

  return { ok: true, data: { items } };
}
