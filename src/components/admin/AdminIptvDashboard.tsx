'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

type AdminRole = 'super_admin' | 'admin';

interface AdminIptvDashboardProps {
  admin: {
    id: string;
    role: AdminRole;
    name: string;
    email: string | null;
    phone: string | null;
  };
}

interface AssignedAdmin {
  id: string;
  role: AdminRole;
  name: string;
  phone: string | null;
}

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
  assignedAdmin: AssignedAdmin | null;
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

interface AuditEntry {
  id: string;
  at: string;
  action: string;
  status: 'success' | 'failed';
  actorLabel: string;
  summary: string;
  target: string | null;
  ipAddress: string | null;
}

interface AdminSummary {
  id: string;
  role: AdminRole;
  name: string;
  email: string | null;
  phone: string | null;
  subscriberCount: number;
  activeSubscriberCount: number;
  revenueKes: number;
}

interface HierarchyNode {
  admin: {
    id: string;
    role: AdminRole;
    name: string;
    email: string | null;
    phone: string | null;
  };
  stats: Overview;
  subscriptions: Subscription[];
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

function formatAuditTime(at: string) {
  return new Date(at).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function roleLabel(role: AdminRole) {
  return role === 'super_admin' ? 'Super Admin' : 'Admin';
}

export default function AdminIptvDashboard({ admin }: AdminIptvDashboardProps) {
  const isSuper = admin.role === 'super_admin';
  const [query, setQuery] = useState('');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [admins, setAdmins] = useState<AdminSummary[]>([]);
  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
  const [filteredCount, setFilteredCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const [activating, setActivating] = useState<string | null>(null);
  const [activateMsg, setActivateMsg] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignmentMsg, setAssignmentMsg] = useState<Record<string, string>>({});
  const [assignmentSelections, setAssignmentSelections] = useState<Record<string, string>>({});
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [createAdminMsg, setCreateAdminMsg] = useState('');

  const syncDashboard = useCallback((data: {
    overview?: Overview;
    auditTrail?: AuditEntry[];
    admins?: AdminSummary[];
    hierarchy?: HierarchyNode[];
    filteredCount?: number;
  }) => {
    setOverview(data.overview ?? null);
    setAuditTrail(data.auditTrail ?? []);
    setAdmins(data.admins ?? []);
    setHierarchy(data.hierarchy ?? []);
    setFilteredCount(data.filteredCount ?? 0);

    const nextSelections: Record<string, string> = {};
    for (const node of data.hierarchy ?? []) {
      for (const subscription of node.subscriptions) {
        nextSelections[subscription.id] = subscription.assignedAdmin?.id ?? admin.id;
      }
    }
    setAssignmentSelections(nextSelections);
  }, [admin.id]);

  const fetchDashboard = useCallback(async (q = '') => {
    setLoading(true);
    setError('');

    try {
      const url = q ? `/api/admin/iptv?q=${encodeURIComponent(q)}` : '/api/admin/iptv';
      const res = await fetch(url, { cache: 'no-store' });

      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not load admin dashboard.');
        return;
      }

      syncDashboard(data);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [syncDashboard]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    fetchDashboard(query.trim());
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/admin/login';
    }
  };

  const handleActivate = async (subscription: Subscription) => {
    setActivating(subscription.id);
    setActivateMsg((prev) => ({ ...prev, [subscription.id]: '' }));

    try {
      const res = await fetch('/api/admin/iptv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          assignedAdminId: assignmentSelections[subscription.id] || subscription.assignedAdmin?.id,
        }),
      });

      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Activation failed');
      }

      setActivateMsg((prev) => ({ ...prev, [subscription.id]: data.message ?? 'Activated.' }));
      fetchDashboard(query.trim());
    } catch (err) {
      setActivateMsg((prev) => ({
        ...prev,
        [subscription.id]: err instanceof Error ? err.message : 'Activation failed',
      }));
    } finally {
      setActivating(null);
    }
  };

  const handleAssign = async (subscription: Subscription) => {
    const adminId = assignmentSelections[subscription.id];
    if (!adminId) return;

    setAssigning(subscription.id);
    setAssignmentMsg((prev) => ({ ...prev, [subscription.id]: '' }));

    try {
      const res = await fetch('/api/admin/iptv/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.id, adminId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not assign user');
      }

      setAssignmentMsg((prev) => ({ ...prev, [subscription.id]: `Assigned to ${data.assignedAdmin.name}.` }));
      fetchDashboard(query.trim());
    } catch (err) {
      setAssignmentMsg((prev) => ({
        ...prev,
        [subscription.id]: err instanceof Error ? err.message : 'Could not assign user',
      }));
    } finally {
      setAssigning(null);
    }
  };

  const handleCreateAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateAdminMsg('');
    setCreatingAdmin(true);

    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdminName,
          phone: newAdminPhone,
          email: newAdminEmail,
          password: newAdminPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not create admin');
      }

      setCreateAdminMsg(`Created ${data.admin.name}.`);
      setNewAdminName('');
      setNewAdminPhone('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      fetchDashboard(query.trim());
    } catch (err) {
      setCreateAdminMsg(err instanceof Error ? err.message : 'Could not create admin');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const visibleAdminOptions = useMemo(
    () => admins.map((teamAdmin) => ({ id: teamAdmin.id, label: `${teamAdmin.name} (${roleLabel(teamAdmin.role)})` })),
    [admins]
  );

  const renderSubscriptionRows = (subscriptions: Subscription[]) => {
    if (subscriptions.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-gray-800 bg-gray-950 p-5 text-sm text-gray-500">
          No users in this group.
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Receipt</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-950">
            {subscriptions.map((subscription) => (
              <tr key={subscription.id} className="transition hover:bg-gray-900/60">
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold text-white">{subscription.customerName}</p>
                  <p className="text-xs text-gray-400">{subscription.email}</p>
                  <p className="text-xs text-gray-500">{subscription.phone}</p>
                  {subscription.member && (
                    <>
                      <p className="text-xs text-red-300">Phone: {subscription.member.profileId}</p>
                      <p className="font-mono text-xs text-red-200">Movie code: {subscription.member.accessCode}</p>
                    </>
                  )}
                  <p className="font-mono text-xs text-gray-600">{subscription.id}</p>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold">{subscription.planName}</p>
                  <p className="text-xs text-gray-400">{formatKes(subscription.amountKes)}</p>
                  <p className="text-xs text-gray-500">
                    Created{' '}
                    {new Date(subscription.createdAt).toLocaleDateString('en-KE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[subscription.status]}`}
                  >
                    {STATUS_ICON[subscription.status]}
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 align-top font-mono text-xs text-emerald-400">
                  {subscription.mpesaReceipt ?? '-'}
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="text-xs font-semibold text-white">
                    {subscription.assignedAdmin?.name ?? 'Unassigned'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {subscription.assignedAdmin ? roleLabel(subscription.assignedAdmin.role) : ''}
                  </p>
                  {isSuper && visibleAdminOptions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <select
                        value={assignmentSelections[subscription.id] ?? subscription.assignedAdmin?.id ?? ''}
                        onChange={(event) =>
                          setAssignmentSelections((prev) => ({
                            ...prev,
                            [subscription.id]: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                      >
                        {visibleAdminOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={assigning === subscription.id}
                        onClick={() => handleAssign(subscription)}
                        className="rounded-lg border-violet-500/40 bg-transparent text-violet-200 hover:bg-violet-950"
                      >
                        {assigning === subscription.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Assign'}
                      </Button>
                      {assignmentMsg[subscription.id] && (
                        <p className="text-xs text-emerald-400">{assignmentMsg[subscription.id]}</p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  {subscription.status !== 'active' ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => handleActivate(subscription)}
                        disabled={activating === subscription.id}
                        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
                      >
                        {activating === subscription.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Zap className="h-3.5 w-3.5" />
                        )}
                        Activate
                      </button>
                      {activateMsg[subscription.id] && (
                        <p className="mt-1 text-xs text-emerald-400">{activateMsg[subscription.id]}</p>
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
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
              Subscription Operations
            </p>
            <h1 className="mt-2 text-3xl font-black">
              {isSuper ? 'Super Admin Hierarchy' : 'Admin User Desk'}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-400">
              {isSuper
                ? 'See every admin, every onboarded user, and the phone-plus-code format under each admin.'
                : 'See only the users assigned to you, with their phone numbers, codes, and payment status.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300 md:min-w-80">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Signed in as</p>
                <p className="mt-1 font-semibold text-white">{admin.name}</p>
                <p className="text-xs text-violet-300">{roleLabel(admin.role)}</p>
                {admin.email && <p className="text-xs text-gray-400">{admin.email}</p>}
                {admin.phone && <p className="text-xs text-gray-500">{admin.phone}</p>}
              </div>
              <ShieldCheck className="h-5 w-5 text-violet-300" />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fetchDashboard(query.trim())}
                className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-xl border-red-500/40 bg-transparent text-red-200 hover:bg-red-950"
              >
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                <span className="ml-1">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder={isSuper ? 'Search across all admins and users...' : 'Search your onboarded users...'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
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
                label: isSuper ? 'All Onboarded Users' : 'Your Users',
                value: overview.totalSubscriptions.toLocaleString(),
                note: `${overview.activeSubscriptions} active / ${overview.pendingSubscriptions} pending`,
                icon: Users,
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
                label: 'Visible Results',
                value: filteredCount.toLocaleString(),
                note: query.trim() ? 'Filtered hierarchy' : 'Current scope',
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

        {isSuper && (
          <>
            <section className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black">Admin Team</h2>
                  <p className="text-sm text-gray-400">Every admin and the users assigned under them.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {admins.map((teamAdmin) => (
                  <div key={teamAdmin.id} className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{teamAdmin.name}</p>
                        <p className="text-xs text-violet-300">{roleLabel(teamAdmin.role)}</p>
                        {teamAdmin.phone && <p className="mt-1 text-xs text-gray-400">{teamAdmin.phone}</p>}
                        {teamAdmin.email && <p className="text-xs text-gray-500">{teamAdmin.email}</p>}
                      </div>
                      <ShieldCheck className="h-4 w-4 text-violet-300" />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-lg bg-gray-900 p-3">
                        <p className="text-gray-500">Users</p>
                        <p className="mt-1 font-bold text-white">{teamAdmin.subscriberCount}</p>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-3">
                        <p className="text-gray-500">Active</p>
                        <p className="mt-1 font-bold text-white">{teamAdmin.activeSubscriberCount}</p>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-3">
                        <p className="text-gray-500">Revenue</p>
                        <p className="mt-1 font-bold text-white">{formatKes(teamAdmin.revenueKes)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black">Create Admin</h2>
                  <p className="text-sm text-gray-400">Add another admin who will only see their own onboarded users.</p>
                </div>
              </div>

              <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <input
                  type="text"
                  required
                  placeholder="Admin name"
                  value={newAdminName}
                  onChange={(event) => setNewAdminName(event.target.value)}
                  className="rounded-xl border border-gray-700 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="0717 402 034"
                  value={newAdminPhone}
                  onChange={(event) => setNewAdminPhone(event.target.value)}
                  className="rounded-xl border border-gray-700 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="admin@gamestop.co.ke"
                  value={newAdminEmail}
                  onChange={(event) => setNewAdminEmail(event.target.value)}
                  className="rounded-xl border border-gray-700 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                />
                <div className="flex gap-3">
                  <input
                    type="password"
                    required
                    placeholder="Temporary password"
                    value={newAdminPassword}
                    onChange={(event) => setNewAdminPassword(event.target.value)}
                    className="flex-1 rounded-xl border border-gray-700 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                  />
                  <Button
                    type="submit"
                    disabled={creatingAdmin}
                    className="rounded-xl bg-violet-600 px-5 hover:bg-violet-700"
                  >
                    {creatingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                  </Button>
                </div>
              </form>
              {createAdminMsg && <p className="mt-3 text-sm text-emerald-400">{createAdminMsg}</p>}
            </section>
          </>
        )}

        <section className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-4">
            <h2 className="text-lg font-black">
              {isSuper ? 'Admin Hierarchy' : 'Your Onboarded Users'}
            </h2>
            <p className="text-sm text-gray-400">
              {isSuper
                ? 'Each section shows the admin and the users assigned under them.'
                : 'These are the users assigned to your account.'}
            </p>
          </div>

          <div className="space-y-6">
            {hierarchy.map((node) => (
              <div key={node.admin.id} className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-black text-white">{node.admin.name}</p>
                    <p className="text-xs text-violet-300">{roleLabel(node.admin.role)}</p>
                    {node.admin.phone && <p className="mt-1 text-xs text-gray-400">{node.admin.phone}</p>}
                    {node.admin.email && <p className="text-xs text-gray-500">{node.admin.email}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs md:min-w-72">
                    <div className="rounded-lg bg-gray-900 p-3">
                      <p className="text-gray-500">Users</p>
                      <p className="mt-1 font-bold text-white">{node.stats.totalSubscriptions}</p>
                    </div>
                    <div className="rounded-lg bg-gray-900 p-3">
                      <p className="text-gray-500">Active</p>
                      <p className="mt-1 font-bold text-white">{node.stats.activeSubscriptions}</p>
                    </div>
                    <div className="rounded-lg bg-gray-900 p-3">
                      <p className="text-gray-500">Revenue</p>
                      <p className="mt-1 font-bold text-white">{formatKes(node.stats.totalRevenueKes)}</p>
                    </div>
                  </div>
                </div>

                {renderSubscriptionRows(node.subscriptions)}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black">Recent Admin Activity</h2>
              <p className="text-sm text-gray-400">Latest sign-ins, searches, activations, and reassignments.</p>
            </div>
          </div>

          {auditTrail.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800 bg-gray-950 p-5 text-sm text-gray-500">
              No audit entries yet.
            </div>
          ) : (
            <div className="space-y-3">
              {auditTrail.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            entry.status === 'success'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {entry.status}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-gray-500">{entry.action}</span>
                      </div>
                      <p className="mt-2 text-sm text-white">{entry.summary}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {entry.actorLabel}
                        {entry.target ? ` | ${entry.target}` : ''}
                        {entry.ipAddress ? ` | ${entry.ipAddress}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">{formatAuditTime(entry.at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
