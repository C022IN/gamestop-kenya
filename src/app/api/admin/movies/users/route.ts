import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/admin-auth';
import { requireAdminRequest } from '@/domains/admin/api/request-context';
import {
  getMoviesAdminSubscribers,
  computeMoviesAdminStats,
} from '@/domains/admin/services/movies-admin-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) return auth.response;

  const { admin } = auth.context.current;
  const superAdmin = isSuperAdmin(admin);

  if (!superAdmin && admin.adminType !== 'movies') {
    return NextResponse.json({ error: 'Movies admin access only.' }, { status: 403 });
  }

  const subscribers = await getMoviesAdminSubscribers(admin.id, superAdmin);
  const stats = computeMoviesAdminStats(subscribers);

  return NextResponse.json({
    subscribers,
    stats,
    referralCode: admin.referralCode,
    referralUrl: admin.referralCode
      ? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gamestop.co.ke'}/movies?ref=${admin.referralCode}`
      : null,
  });
}
