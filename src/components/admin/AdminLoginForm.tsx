'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, LockKeyhole, ShieldCheck, Smartphone } from 'lucide-react';

interface AdminLoginFormProps {
  configured: boolean;
  loginHint: string | null;
}

export default function AdminLoginForm({ configured, loginHint }: AdminLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const next = searchParams.get('next') || '/admin/iptv';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Could not sign in.');
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-violet-950 to-gray-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 md:grid-cols-[1.05fr,0.95fr] md:items-center">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
              Super Admin
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-6xl">
              Manage subscriptions, codes, and client recovery
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-gray-300">
              Sign in with your admin email or phone number to view generated movie codes, IPTV credentials, and recent subscription activity.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Private admin access',
                  text: 'The dashboard is protected by an HTTP-only session.',
                },
                {
                  icon: Smartphone,
                  title: 'Phone or email login',
                  text: 'Use the super-admin identity you configure on the server.',
                },
                {
                  icon: LockKeyhole,
                  title: 'Audit trail included',
                  text: 'Sign-ins, searches, and activations are recorded.',
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm text-gray-300">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-black">Admin Sign-In</h2>
            <p className="mt-2 text-sm text-gray-300">
              {configured
                ? `Configured login: ${loginHint ?? 'your admin identity'}`
                : 'Admin login is not configured yet. Add the super-admin environment variables first.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-200">Email or Phone</label>
                <input
                  type="text"
                  required
                  disabled={!configured || loading}
                  placeholder="admin@gamestop.co.ke or 0717402034"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-violet-400 focus:outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-200">Password</label>
                <input
                  type="password"
                  required
                  disabled={!configured || loading}
                  placeholder="Your super-admin password"
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
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Open Admin Dashboard'}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-100">
              <p className="font-semibold">Required setup</p>
              <p className="mt-1">
                Set <span className="font-mono">SUPER_ADMIN_EMAIL</span> or <span className="font-mono">SUPER_ADMIN_PHONE</span>, plus <span className="font-mono">SUPER_ADMIN_PASSWORD</span> in your server environment.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
