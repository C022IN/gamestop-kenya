import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export default async function AdminRootPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    redirect('/admin/login');
  }

  const { admin } = current;

  if (admin.role === 'super_admin') {
    redirect('/admin/iptv');
  }

  if (admin.adminType === 'catalog') {
    redirect('/admin/catalog/listings');
  }

  if (admin.adminType === 'movies') {
    redirect('/admin/movies/users');
  }

  // Default (iptv admins)
  redirect('/admin/iptv');
}
