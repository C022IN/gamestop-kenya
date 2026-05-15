import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import { isAdminConfigured } from '@/lib/admin-auth';
import { getCurrentAdmin } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

interface AdminLoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const current = await getCurrentAdmin();
  if (current) {
    redirect('/admin');
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const next = resolvedSearchParams?.next;
  const nextPath = Array.isArray(next) ? next[0] : next;

  return (
    <Suspense fallback={null}>
      <AdminLoginForm configured={await isAdminConfigured()} nextPath={nextPath} />
    </Suspense>
  );
}
