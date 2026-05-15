import { redirect } from 'next/navigation';
import AdminIptvDashboard from '@/components/admin/AdminIptvDashboard';
import { getCurrentAdmin } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export default async function AdminIptvPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    redirect('/admin/login?next=/admin/iptv');
  }

  const { admin } = current;
  const isSuperAdmin = admin.role === 'super_admin';

  if (!isSuperAdmin && admin.adminType !== 'iptv') {
    redirect('/admin');
  }

  return (
    <AdminIptvDashboard
      admin={{
        id: admin.id,
        role: admin.role,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
      }}
    />
  );
}
