'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

interface AdminLoginFormProps {
  configured: boolean;
  nextPath?: string;
}

export default function AdminLoginForm({ configured, nextPath }: AdminLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const next = nextPath || '/admin/iptv';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Could not sign in.');
        return;
      }

      window.location.href = next;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-violet-950 to-gray-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-md">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h1 className="text-2xl font-black">Admin Sign-In</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-200">Email</label>
              <input
                type="email"
                required
                disabled={!configured || loading}
                placeholder="admin@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-violet-400 focus:outline-none disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-200">Password</label>
              <input
                type="password"
                required
                disabled={!configured || loading}
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-violet-400 focus:outline-none disabled:opacity-60"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={!configured || loading}
              className="w-full rounded-xl bg-violet-600 py-6 text-base font-bold hover:bg-violet-700"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
