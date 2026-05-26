'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clapperboard,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Tv,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: 'success' | 'error' }
let _counter = 0;
let _push: ((msg: string, type?: 'success' | 'error') => void) | null = null;

function useToastStack() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++_counter;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  }, []);
  _push = push;
  return toasts;
}

function toast(message: string, type: 'success' | 'error' = 'success') {
  _push?.(message, type);
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-sm ${
            t.type === 'error'
              ? 'border border-red-700 bg-red-900/90 text-red-100'
              : 'border border-gray-600 bg-gray-800/95 text-white'
          }`}
        >
          {t.type === 'error'
            ? <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
            : <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminRole = 'super_admin' | 'admin';
type AdminType = 'iptv' | 'catalog' | 'movies';

interface TeamAdmin {
  id: string;
  role: AdminRole;
  adminType: AdminType | null;
  name: string;
  email: string | null;
  phone: string | null;
  referralCode: string | null;
  onboardedUsers: number;
  activeUsers: number;
  pendingUsers: number;
}

interface AuditEntry {
  id: string;
  at: string;
  action: string;
  status: 'success' | 'failed';
  actorLabel: string;
  summary: string;
  target: string | null;
}

interface AdminSuperDashboardProps {
  admin: {
    id: string;
    name: string;
    email: string | null;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<AdminType, { label: string; color: string; bg: string; icon: React.ReactNode; href: string }> = {
  iptv: {
    label: 'IPTV Admin',
    color: 'text-violet-300',
    bg: 'bg-violet-500/15',
    icon: <Tv className="h-4 w-4" />,
    href: '/admin/iptv',
  },
  catalog: {
    label: 'Catalog Admin',
    color: 'text-blue-300',
    bg: 'bg-blue-500/15',
    icon: <BookOpen className="h-4 w-4" />,
    href: '/admin/catalog/listings',
  },
  movies: {
    label: 'Movies Admin',
    color: 'text-amber-300',
    bg: 'bg-amber-500/15',
    icon: <Clapperboard className="h-4 w-4" />,
    href: '/admin/movies/users',
  },
};

function typeMeta(type: AdminType | null) {
  return type ? TYPE_META[type] : null;
}

function TypeBadge({ type }: { type: AdminType | null }) {
  const meta = typeMeta(type);
  if (!meta) return <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">Super Admin</span>;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.bg} ${meta.color}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-KE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSuperDashboard({ admin }: AdminSuperDashboardProps) {
  const toasts = useToastStack();

  const [admins, setAdmins] = useState<TeamAdmin[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  // Create admin form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newType, setNewType] = useState<AdminType>('iptv');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/team', { cache: 'no-store' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Could not load team data.'); return; }
      setAdmins(data.admins ?? []);
      setAuditTrail(data.auditTrail ?? []);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await fetch('/api/admin/auth/logout', { method: 'POST' }); } finally {
      window.location.href = '/admin/login';
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg('');
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, phone: newPhone || null, email: newEmail, password: newPassword, adminType: newType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateMsg(data.error ?? 'Could not create admin.');
        toast(data.error ?? 'Could not create admin.', 'error');
        return;
      }
      toast(`${newName} added as ${newType} admin.`);
      setNewName(''); setNewPhone(''); setNewEmail(''); setNewPassword(''); setNewType('iptv');
      setAdmins(data.admins ?? admins);
      setAuditTrail(data.auditTrail ?? auditTrail);
    } catch {
      setCreateMsg('Network error.');
      toast('Network error.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const staffAdmins = admins.filter((a) => a.role !== 'super_admin');
  const byType = (type: AdminType) => staffAdmins.filter((a) => a.adminType === type);

  return (
    <div className="min-h-screen bg-black text-white">
      <ToastStack toasts={toasts} />

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-black leading-tight text-white">GameStop Kenya</p>
              <p className="text-xs font-semibold text-amber-400">Super Admin — {admin.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTeam}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              {loggingOut ? 'Logging out…' : 'Logout'}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-800/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Quick-nav to scoped dashboards ─────────────────────────── */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Jump to dashboard</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(Object.entries(TYPE_META) as [AdminType, typeof TYPE_META[AdminType]][]).map(([type, meta]) => {
              const count = byType(type).length;
              return (
                <a
                  key={type}
                  href={meta.href}
                  className="group flex items-center justify-between rounded-2xl border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-600 hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.bg} ${meta.color}`}>
                      {meta.icon}
                    </div>
                    <div>
                      <p className="font-bold text-white">{meta.label}s</p>
                      <p className="text-xs text-gray-400">{count} admin{count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600 transition group-hover:text-white" />
                </a>
              );
            })}
          </div>
        </section>

        {/* ─── Stats cards ─────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Total Admins', value: staffAdmins.length },
            { label: 'IPTV Admins', value: byType('iptv').length },
            { label: 'Catalog Admins', value: byType('catalog').length },
            { label: 'Movies Admins', value: byType('movies').length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="mt-1 text-2xl font-black text-white">{value}</p>
            </div>
          ))}
        </section>

        {/* ─── Admin team table ────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-white">Admin Team</h2>
              <p className="text-xs text-gray-400">All staff admins with their scoped roles and referral codes.</p>
            </div>
          </div>

          {loading && staffAdmins.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : staffAdmins.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No staff admins yet. Create one below.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="pb-2 pr-4 text-xs font-semibold text-gray-500">Name</th>
                    <th className="pb-2 pr-4 text-xs font-semibold text-gray-500">Role</th>
                    <th className="pb-2 pr-4 text-xs font-semibold text-gray-500">Contact</th>
                    <th className="pb-2 pr-4 text-xs font-semibold text-gray-500">Referral Code</th>
                    <th className="pb-2 pr-4 text-xs font-semibold text-gray-500">Users</th>
                    <th className="pb-2 text-xs font-semibold text-gray-500">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {staffAdmins.map((a) => (
                    <tr key={a.id}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-white">{a.name}</p>
                        <p className="text-xs text-gray-500">{a.id}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <TypeBadge type={a.adminType} />
                      </td>
                      <td className="py-3 pr-4 text-gray-400">
                        <p className="text-xs">{a.email ?? '—'}</p>
                        <p className="text-xs">{a.phone ?? ''}</p>
                      </td>
                      <td className="py-3 pr-4">
                        {a.referralCode
                          ? <span className="rounded bg-gray-800 px-2 py-0.5 font-mono text-xs text-gray-300">{a.referralCode}</span>
                          : <span className="text-xs text-gray-600">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-center text-white">{a.onboardedUsers}</td>
                      <td className="py-3 text-center text-emerald-400">{a.activeUsers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ─── Create admin form ───────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-white">Add Staff Admin</h2>
              <p className="text-xs text-gray-400">New admins get a unique referral code automatically.</p>
            </div>
          </div>

          <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400">Full Name *</label>
              <input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Jane Kamau"
                className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400">Email *</label>
              <input
                required
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="jane@example.com"
                className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400">Phone (optional)</label>
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="0712345678"
                className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400">Password *</label>
              <input
                required
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Strong password"
                className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400">Admin Type *</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as AdminType)}
                className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="iptv">IPTV Admin</option>
                <option value="catalog">Catalog Admin</option>
                <option value="movies">Movies Admin</option>
              </select>
            </div>
            <div className="flex flex-col justify-end gap-1">
              <button
                type="submit"
                disabled={creating}
                className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {creating ? 'Creating…' : 'Create Admin'}
              </button>
              {createMsg && <p className="text-xs text-red-400">{createMsg}</p>}
            </div>
          </form>

          {/* Role definitions */}
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(Object.entries(TYPE_META) as [AdminType, typeof TYPE_META[AdminType]][]).map(([type, meta]) => (
              <div key={type} className={`rounded-xl border border-gray-800 p-3 ${meta.bg}/20`}>
                <div className={`mb-1 flex items-center gap-1.5 text-xs font-bold ${meta.color}`}>
                  {meta.icon}
                  {meta.label}
                </div>
                <p className="text-xs text-gray-500">
                  {type === 'iptv' && 'Manages IPTV subscriptions, activates plans, assigns users, generates access codes.'}
                  {type === 'catalog' && 'Creates product listings, tracks link clicks and buyer inquiries through their referral code.'}
                  {type === 'movies' && 'Manages movie/TV profiles and entitlements for customers assigned under them.'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Audit trail ─────────────────────────────────────────────── */}
        {auditTrail.length > 0 && (
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="mb-4 font-black text-white">Audit Trail</h2>
            <div className="space-y-2">
              {auditTrail.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 rounded-xl bg-gray-950 px-3 py-2.5">
                  <div className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${entry.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white">{entry.summary}</p>
                    <p className="mt-0.5 text-[10px] text-gray-500">
                      {entry.actorLabel} · {fmtDate(entry.at)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    entry.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
