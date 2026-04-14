import { redirect } from 'next/navigation';
import AdminMoviesDashboard from '@/components/admin/AdminMoviesDashboard';
import { getCurrentAdmin } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export default async function AdminMoviesUsersPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    redirect('/admin/login?next=/admin/movies/users');
  }

  const { admin } = current;
  const isSuperAdmin = admin.role === 'super_admin';

  if (!isSuperAdmin && admin.adminType !== 'movies') {
    redirect('/admin');
  }

  return (
    <AdminMoviesDashboard
      admin={{
        id: admin.id,
        role: admin.role,
        adminType: admin.adminType,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        referralCode: admin.referralCode,
      }}
    />
  );
}
