'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LockKeyhole, Smartphone, Tv } from 'lucide-react';

export default function MoviesLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/movies/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, accessCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Login failed.');
        return;
      }

      router.push('/movies');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-red-950 to-gray-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 md:grid-cols-[1.05fr,0.95fr] md:items-center">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-300">
              GameStop Movies
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-6xl">
              Sign In With Your M-Pesa Number and Access Code
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-gray-300">
              Your movie account is created automatically after successful payment. Use the normalized M-Pesa number as your profile ID and the generated access code from the payment screen.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Smartphone,
                  title: 'Phone-based identity',
                  text: 'No email or password is required in V1.',
                },
                {
                  icon: LockKeyhole,
                  title: 'Code-based login',
                  text: 'Use the access code generated at activation.',
                },
                {
                  icon: Tv,
                  title: 'Movie library access',
                  text: 'Watch entitled titles after sign-in.',
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm text-gray-300">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-black">Member Login</h2>
            <p className="mt-2 text-sm text-gray-300">
              Example profile ID format: <span className="font-mono">254712345678</span>
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-200">M-Pesa Number</label>
                <input
                  type="tel"
                  required
                  placeholder="0712 345 678 or 254712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-red-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-200">Access Code</label>
                <input
                  type="text"
                  required
                  placeholder="Generated after payment"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm uppercase tracking-[0.2em] text-white placeholder-gray-500 focus:border-red-400 focus:outline-none"
                />
              </div>
              {error && <p className="text-sm text-red-300">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-red-600 py-6 text-base font-bold hover:bg-red-700"
              >
                {loading ? 'Signing in...' : 'Open My Movies'}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
              <p className="font-semibold">No access code yet?</p>
              <p className="mt-1">
                Complete payment first from the{' '}
                <Link href="/iptv" className="underline">
                  IPTV dashboard
                </Link>
                . If you already paid and lost the code, contact support or the admin team.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
