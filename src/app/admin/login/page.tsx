import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import { getConfiguredAdmin } from '@/lib/admin-auth';
import { getCurrentAdmin } from '@/lib/admin-session';

export default async function AdminLoginPage() {
  const current = await getCurrentAdmin();
  if (current) {
    redirect('/admin/iptv');
  }

  const admin = await getConfiguredAdmin();
  const loginHint = admin?.phone ?? admin?.email ?? null;

  return <AdminLoginForm configured={Boolean(admin)} loginHint={loginHint} />;
}
