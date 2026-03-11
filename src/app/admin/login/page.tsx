import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import { isAdminConfigured } from '@/lib/admin-auth';
import { getCurrentAdmin } from '@/lib/admin-session';

export default async function AdminLoginPage() {
  const current = await getCurrentAdmin();
  if (current) {
    redirect('/admin/iptv');
  }

  return <AdminLoginForm configured={isAdminConfigured()} />;
}
