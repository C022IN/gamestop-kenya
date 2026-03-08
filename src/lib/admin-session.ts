import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, getAdminContextByToken } from '@/lib/admin-auth';

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  return await getAdminContextByToken(token);
}
