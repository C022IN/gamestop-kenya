import { redirect } from 'next/navigation';
import AdminCatalogMediaDashboard from '@/components/admin/AdminCatalogMediaDashboard';
import { getCurrentAdmin } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export default async function AdminCatalogPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    redirect('/admin/login?next=/admin/catalog');
  }

  return (
    <AdminCatalogMediaDashboard
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
