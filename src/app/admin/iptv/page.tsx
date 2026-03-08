'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Wallet,
  Zap,
} from 'lucide-react';

interface Subscription {
  id: string;
  planId: string;
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
  member?: {
    profileId: string;
    accessCode: string;
  };
}

interface Overview {
  totalSubscriptions: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenueKes: number;
  activeRevenueKes: number;
  averageOrderValueKes: number;
  expiringWithin30Days: number;
  planBreakdown: Array<{
    planId: string;
    planName: string;
    count: number;
    revenueKes: number;
  }>;
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

function formatKes(amount: number) {
  return `KSh ${amount.toLocaleString()}`;
}

export default function AdminIptvPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  const [query, setQuery] = useState('');
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [filteredCount, setFilteredCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activating, setActivating] = useState<string | null>(null);
  const [activateMsg, setActivateMsg] = useState<Record<string, string>>({});

  const syncDashboard = (data: {
    subscriptions?: Subscription[];
    overview?: Overview;
    filteredCount?: number;
  }) => {
    setSubs(data.subscriptions ?? []);
    setOverview(data.overview ?? null);
    setFilteredCount(data.filteredCount ?? data.subscriptions?.length ?? 0);
  };

  const fetchSubs = useCallback(
    async (q = '') => {
      setLoading(true);
      setError('');
      try {
        const url = q ? `/api/admin/iptv?q=${encodeURIComponent(q)}` : '/api/admin/iptv';
        const res = await fetch(url, { headers: { 'x-admin-secret': secret } });
        if (res.status === 401) {
          setAuthed(false);
          setAuthError('Wrong secret.');
          return;
        }
        const data = await res.json();
        syncDashboard(data);
      } catch {
        setError('Network error.');
      } finally {
        setLoading(false);
      }
    },
    [secret]
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/admin/iptv', { headers: { 'x-admin-secret': secret } });
    if (res.status === 401) {
      setAuthError('Wrong secret.');
      return;
    }
    setAuthed(true);
    const data = await res.json();
    syncDashboard(data);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubs(query.trim());
  };

  const activate = async (sub: Subscription) => {
    setActivating(sub.id);
    setActivateMsg((prev) => ({ ...prev, [sub.id]: '' }));
    try {
      const res = await fetch('/api/admin/iptv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ subscriptionId: sub.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setActivateMsg((prev) => ({ ...prev, [sub.id]: data.message ?? 'Activated!' }));
      fetchSubs(query.trim());
    } catch (err) {
      setActivateMsg((prev) => ({
        ...prev,
        [sub.id]: err instanceof Error ? err.message : 'Error',
      }));
    } finally {
      setActivating(null);
    }
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-8">
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

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
              Subscription Operations
            </p>
            <h1 className="mt-2 text-3xl font-black">IPTV Admin Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-400">
              Manage customer subscriptions, payment activations, and renewals from one internal screen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchSubs(query.trim())}
            className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <form onSubmit={handleSearch} className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder="Search by email or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
          />
          <Button type="submit" disabled={loading} className="rounded-xl bg-violet-600 px-5 hover:bg-violet-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        {error && (
          <div className="mb-4 rounded-xl border border-red-800 bg-red-900/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {overview && (
          <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Subscribers',
                value: overview.totalSubscriptions.toLocaleString(),
                note: `${overview.activeSubscriptions} active / ${overview.pendingSubscriptions} pending`,
                icon: CheckCircle2,
              },
              {
                label: 'Revenue',
                value: formatKes(overview.totalRevenueKes),
                note: `${formatKes(overview.activeRevenueKes)} active revenue`,
                icon: Wallet,
              },
              {
                label: 'Average Order',
                value: formatKes(overview.averageOrderValueKes),
                note: `${overview.expiringWithin30Days} expiring within 30 days`,
                icon: Zap,
              },
              {
                label: 'Loaded View',
                value: filteredCount.toLocaleString(),
                note: query.trim() ? 'Filtered result set' : 'Full subscription list',
                icon: Search,
              },
            ].map(({ label, value, note, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
                <p className="mt-1 text-2xl font-black">{value}</p>
                <p className="mt-1 text-xs text-gray-400">{note}</p>
              </div>
            ))}
          </section>
        )}

        {overview && overview.planBreakdown.length > 0 && (
          <section className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div className="mb-4">
              <h2 className="text-lg font-black">Plan Mix</h2>
              <p className="text-sm text-gray-400">Current subscription distribution by plan.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {overview.planBreakdown.map((plan) => (
                <div key={plan.planId} className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                  <p className="text-sm font-semibold text-white">{plan.planName}</p>
                  <p className="mt-2 text-2xl font-black">{plan.count}</p>
                  <p className="text-xs text-gray-400">{formatKes(plan.revenueKes)} booked revenue</p>
                </div>
              ))}
            </div>
          </section>
        )}

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
                  <tr key={sub.id} className="transition hover:bg-gray-900/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{sub.customerName}</p>
                      <p className="text-xs text-gray-400">{sub.email}</p>
                      <p className="text-xs text-gray-500">{sub.phone}</p>
                      {sub.member && (
                        <>
                          <p className="text-xs text-red-300">Profile ID: {sub.member.profileId}</p>
                          <p className="font-mono text-xs text-red-200">Code: {sub.member.accessCode}</p>
                        </>
                      )}
                      <p className="font-mono text-xs text-gray-600">{sub.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{sub.planName}</p>
                      <p className="text-xs text-gray-400">{formatKes(sub.amountKes)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[sub.status]}`}
                      >
                        {STATUS_ICON[sub.status]}
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-emerald-400">
                      {sub.mpesaReceipt ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(sub.createdAt).toLocaleDateString('en-KE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
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
                            {activating === sub.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Zap className="h-3.5 w-3.5" />
                            )}
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
