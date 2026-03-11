'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function MemberLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    await fetch('/api/movies/auth/logout', { method: 'POST' });
    router.push('/movies/login');
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={logout}
      disabled={loading}
      className="rounded-2xl border-white/15 bg-transparent px-6 py-5 font-bold text-white hover:bg-white/10"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
}
