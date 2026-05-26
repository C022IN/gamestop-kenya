import { redirect } from 'next/navigation';
import AdminSuperDashboard from '@/components/admin/AdminSuperDashboard';
import { getCurrentAdmin } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export default async function AdminSuperPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    redirect('/admin/login?next=/admin/super');
  }

  if (current.admin.role !== 'super_admin') {
    redirect('/admin');
  }

  const { admin } = current;

  return (
    <AdminSuperDashboard
      admin={{
        id: admin.id,
        name: admin.name,
        email: admin.email,
      }}
    />
  );
}
