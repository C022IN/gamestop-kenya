import { redirect } from 'next/navigation';
import AdminCatalogDashboard from '@/components/admin/AdminCatalogDashboard';
import { getCurrentAdmin } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export default async function AdminCatalogListingsPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    redirect('/admin/login?next=/admin/catalog/listings');
  }

  const { admin } = current;
  const isSuperAdmin = admin.role === 'super_admin';

  if (!isSuperAdmin && admin.adminType !== 'catalog') {
    redirect('/admin');
  }

  return (
    <AdminCatalogDashboard
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
