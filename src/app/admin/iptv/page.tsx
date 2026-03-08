import { redirect } from 'next/navigation';
import AdminIptvDashboard from '@/components/admin/AdminIptvDashboard';
import { getCurrentAdmin } from '@/lib/admin-session';

export default async function AdminIptvPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    redirect('/admin/login?next=/admin/iptv');
  }

  return (
    <AdminIptvDashboard
      admin={{
        id: current.admin.id,
        role: current.admin.role,
        name: current.admin.name,
        email: current.admin.email,
        phone: current.admin.phone,
      }}
    />
  );
}
