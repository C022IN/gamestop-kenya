import { redirect } from 'next/navigation';
import AdminCatalogMediaDashboard from '@/components/admin/AdminCatalogMediaDashboard';
import { getCurrentAdmin } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export default async function AdminCatalogPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    redirect('/admin/login?next=/admin/catalog');
  }

  const { admin } = current;
  const isSuperAdmin = admin.role === 'super_admin';

  if (!isSuperAdmin && admin.adminType !== 'catalog') {
    redirect('/admin');
  }

  return (
    <AdminCatalogMediaDashboard
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
