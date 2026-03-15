'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LockKeyhole, ShieldCheck, Smartphone, Tv2 } from 'lucide-react';

export default function MoviesLoginPage() {
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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

      window.location.href = '/movies';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#040814] px-4 py-14 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_22%),linear-gradient(180deg,#040814_0%,#08111f_55%,#040814_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              GameStop IPTV Member Access
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
              Open your member hub.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/[0.66]">
              Use your payment phone number and access code.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Smartphone,
                  title: 'Phone sign in',
                  text: 'Use your M-Pesa number.',
                },
                {
                  icon: LockKeyhole,
                  title: 'Access code',
                  text: 'Shown after activation.',
                },
                {
                  icon: Tv2,
                  title: 'One hub',
                  text: 'Live TV, movies, series, sports.',
                },
              ].map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] text-white/80">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-lg font-bold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/[0.64]">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Member Sign In</h2>
                <p className="mt-2 text-sm text-white/[0.62]">
                  Use the phone number tied to your plan.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/84">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="0712 345 678 or 254712345678"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-sky-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/84">Access Code</label>
                <input
                  type="text"
                  required
                  placeholder="Shown after activation"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm uppercase tracking-[0.2em] text-white placeholder-white/30 focus:border-sky-300 focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-rose-300">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white py-6 text-base font-bold text-slate-950 hover:bg-slate-100"
              >
                {loading ? 'Signing in...' : 'Open My Hub'}
              </Button>
            </form>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm text-white/[0.66]">
              <p className="font-semibold text-white">No access code yet?</p>
              <p className="mt-1 leading-6">
                Pay from the{' '}
                <Link href="/iptv" className="font-semibold text-sky-200 underline">
                  IPTV plans page
                </Link>
                {' '}or contact support if payment already went through.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
