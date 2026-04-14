import {
  createMovieSession,
  getProfileByAccessCode,
  MOVIE_SESSION_COOKIE,
} from '@/lib/movie-platform';

// Re-export cookie name so routes can use it without importing lib directly
export { MOVIE_SESSION_COOKIE };

type ServiceError = { ok: false; error: string; status: number };
type ServiceSuccess<T> = { ok: true; data: T };
type ServiceResult<T> = ServiceError | ServiceSuccess<T>;

export interface MovieLoginResult {
  profile: { profileId: string; phone: string };
  session: { token: string; expiresAt: string };
}

export async function loginWithAccessCode(params: {
  phone: string;
  accessCode: string;
}): Promise<ServiceResult<MovieLoginResult>> {
  const profile = await getProfileByAccessCode(params.phone, params.accessCode);
  if (!profile) {
    return { ok: false, error: 'Invalid phone or access code', status: 401 };
  }

  const session = await createMovieSession(profile.profileId);
  if (!session) {
    return { ok: false, error: 'Could not create session', status: 500 };
  }

  return {
    ok: true,
    data: {
      profile: { profileId: profile.profileId, phone: profile.phone },
      session: { token: session.token, expiresAt: session.expiresAt },
    },
  };
}
