'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface Subscription {
  id: string;
  planName: string;
  months: number;
  amountKes: number;
  customerName: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'expired';
  mpesaReceipt?: string;
  createdAt: string;
  expiresAt: string;
  activatedAt?: string;
}

const STATUS_STYLE = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  expired: 'bg-gray-100 text-gray-500',
};

const STATUS_ICON = {
  active: <CheckCircle2 className="h-3.5 w-3.5" />,
  pending: <Clock className="h-3.5 w-3.5" />,
  expired: <AlertCircle className="h-3.5 w-3.5" />,
};

export default function AdminIptvPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  const [query, setQuery] = useState('');
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activating, setActivating] = useState<string | null>(null);
  const [activateMsg, setActivateMsg] = useState<Record<string, string>>({});

  const fetchSubs = useCallback(async (q = '') => {
    setLoading(true);
    setError('');
    try {
      const url = q ? `/api/admin/iptv?q=${encodeURIComponent(q)}` : '/api/admin/iptv';
      const res = await fetch(url, { headers: { 'x-admin-secret': secret } });
      if (res.status === 401) { setAuthed(false); setAuthError('Wrong secret.'); return; }
      const data = await res.json();
      setSubs(data.subscriptions ?? []);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [secret]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/admin/iptv', { headers: { 'x-admin-secret': secret } });
    if (res.status === 401) { setAuthError('Wrong secret.'); return; }
    setAuthed(true);
    const data = await res.json();
    setSubs(data.subscriptions ?? []);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubs(query.trim());
  };

  const activate = async (sub: Subscription) => {
    setActivating(sub.id);
    setActivateMsg((p) => ({ ...p, [sub.id]: '' }));
    try {
      const res = await fetch('/api/admin/iptv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ subscriptionId: sub.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setActivateMsg((p) => ({ ...p, [sub.id]: data.message ?? 'Activated!' }));
      // Refresh list
      fetchSubs(query.trim());
    } catch (err) {
      setActivateMsg((p) => ({ ...p, [sub.id]: err instanceof Error ? err.message : 'Error' }));
    } finally {
      setActivating(null);
    }
  };

  // --- Login gate ---
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-800 p-8">
          <h1 className="mb-1 text-xl font-black text-white">IPTV Admin</h1>
          <p className="mb-6 text-sm text-gray-400">Enter your admin secret to continue.</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Admin secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
            />
            {authError && <p className="text-xs text-red-400">{authError}</p>}
            <Button type="submit" className="w-full rounded-xl bg-violet-600 font-bold hover:bg-violet-700">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // --- Admin dashboard ---
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">IPTV Subscriptions</h1>
            <p className="text-sm text-gray-400">{subs.length} subscription{subs.length !== 1 ? 's' : ''} loaded</p>
          </div>
          <button
            type="button"
            onClick={() => fetchSubs(query.trim())}
            className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder="Search by email or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
          />
          <Button type="submit" disabled={loading} className="rounded-xl bg-violet-600 px-5 hover:bg-violet-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        {error && (
          <div className="mb-4 rounded-xl border border-red-800 bg-red-900/30 p-3 text-sm text-red-400">{error}</div>
        )}

        {/* Table */}
        {subs.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">
            No subscriptions found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Receipt</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-950">
                {subs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-900/60 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{sub.customerName}</p>
                      <p className="text-xs text-gray-400">{sub.email}</p>
                      <p className="text-xs text-gray-500">{sub.phone}</p>
                      <p className="font-mono text-xs text-gray-600">{sub.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{sub.planName}</p>
                      <p className="text-xs text-gray-400">KSh {sub.amountKes.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[sub.status]}`}>
                        {STATUS_ICON[sub.status]}
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-emerald-400">
                      {sub.mpesaReceipt ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(sub.createdAt).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {sub.status !== 'active' ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => activate(sub)}
                            disabled={activating === sub.id}
                            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
                          >
                            {activating === sub.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Zap className="h-3.5 w-3.5" />}
                            Activate
                          </button>
                          {activateMsg[sub.id] && (
                            <p className="mt-1 text-xs text-emerald-400">{activateMsg[sub.id]}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
