'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Film,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Signal,
  Timer,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type AdminRole = 'super_admin' | 'admin';
type AdminType = 'iptv' | 'catalog' | 'movies';

interface AdminMoviesDashboardProps {
  admin: {
    id: string;
    role: AdminRole;
    adminType: AdminType | null;
    name: string;
    email: string | null;
    phone: string | null;
    referralCode: string | null;
  };
}

interface MoviesSubscriberCredentials {
  m3uUrl: string;
  xtreamHost: string;
  xtreamUsername: string;
  xtreamPassword: string;
  xtreamPort: number;
}

interface MoviesSubscriber {
  subscriptionId: string;
  profileId: string | null;
  accessCode: string | null;
  customerName: string;
  phone: string;
  email: string;
  planName: string;
  amountKes: number;
  status: 'pending' | 'active' | 'expired';
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string;
  credentials: MoviesSubscriberCredentials | null;
  moviesAdminId: string;
}

interface MoviesAdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  expiredUsers: number;
  totalRevenueKes: number;
}

const STATUS_COLORS = {
  active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  expired: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }, []);
  return { copiedKey, copy };
}

function CopyButton({ text, label, copyKey }: { text: string; label: string; copyKey: string }) {
  const { copiedKey, copy } = useCopy();
  const copied = copiedKey === copyKey;
  return (
    <button
      onClick={() => copy(text, copyKey)}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
    >
      {copied ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {copied ? 'Copied!' : label}
    </button>
  );
}

function CredField({ label, value, copyKey }: { label: string; value: string; copyKey: string }) {
  const [visible, setVisible] = useState(false);
  const { copiedKey, copy } = useCopy();
  const copied = copiedKey === copyKey;

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-slate-500 w-28 shrink-0">{label}</span>
      <span className="text-xs text-slate-300 flex-1 font-mono truncate">
        {visible ? value : '••••••••••••'}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setVisible((v) => !v)}
          className="text-slate-500 hover:text-white transition-colors"
        >
          {visible ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          onClick={() => copy(value, copyKey)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {copied ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function SubscriberCard({ subscriber }: { subscriber: MoviesSubscriber }) {
  const [expanded, setExpanded] = useState(false);
  const daysLeft = Math.ceil(
    (new Date(subscriber.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-violet-500/30 transition-colors">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-white">{subscriber.customerName}</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[subscriber.status]}`}
              >
                {subscriber.status.charAt(0).toUpperCase() + subscriber.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">{subscriber.phone}</p>
            <p className="text-xs text-slate-500 mt-0.5">{subscriber.planName}</p>
          </div>
          <div className="text-right shrink-0">
            {subscriber.status === 'active' && daysLeft > 0 ? (
              <p className="text-xs text-emerald-300">{daysLeft}d remaining</p>
            ) : subscriber.status === 'expired' ? (
              <p className="text-xs text-red-400">Expired</p>
            ) : (
              <p className="text-xs text-yellow-300">Pending</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              KSh {subscriber.amountKes.toLocaleString()}
            </p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
          {/* Login details */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Member Login</p>
            <div className="bg-black/30 rounded-lg px-3 py-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 w-28">Phone</span>
                <span className="text-xs text-slate-300 font-mono flex-1">{subscriber.phone}</span>
                <CopyButton
                  text={subscriber.phone}
                  label="Copy"
                  copyKey={`phone-${subscriber.subscriptionId}`}
                />
              </div>
              {subscriber.accessCode && (
                <div className="flex items-center justify-between border-t border-white/5 pt-1">
                  <span className="text-xs text-slate-500 w-28">Access Code</span>
                  <span className="text-xs text-emerald-300 font-mono flex-1 font-bold">
                    {subscriber.accessCode}
                  </span>
                  <CopyButton
                    text={subscriber.accessCode}
                    label="Copy"
                    copyKey={`code-${subscriber.subscriptionId}`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* IPTV credentials */}
          {subscriber.credentials ? (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">IPTV Credentials</p>
              <div className="bg-black/30 rounded-lg px-3 py-2">
                <CredField
                  label="M3U URL"
                  value={subscriber.credentials.m3uUrl}
                  copyKey={`m3u-${subscriber.subscriptionId}`}
                />
                <CredField
                  label="Server"
                  value={subscriber.credentials.xtreamHost}
                  copyKey={`host-${subscriber.subscriptionId}`}
                />
                <CredField
                  label="Username"
                  value={subscriber.credentials.xtreamUsername}
                  copyKey={`user-${subscriber.subscriptionId}`}
                />
                <CredField
                  label="Password"
                  value={subscriber.credentials.xtreamPassword}
                  copyKey={`pass-${subscriber.subscriptionId}`}
                />
                <CredField
                  label="Port"
                  value={String(subscriber.credentials.xtreamPort)}
                  copyKey={`port-${subscriber.subscriptionId}`}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No credentials yet — subscription is pending activation.
            </p>
          )}

          <div className="text-xs text-slate-600 pt-1">
            Subscribed {new Date(subscriber.createdAt).toLocaleDateString()}
            {subscriber.activatedAt && (
              <> · Activated {new Date(subscriber.activatedAt).toLocaleDateString()}</>
            )}
            {' · '}Expires {new Date(subscriber.expiresAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminMoviesDashboard({ admin }: AdminMoviesDashboardProps) {
  const isSuperAdmin = admin.role === 'super_admin';
  const [subscribers, setSubscribers] = useState<MoviesSubscriber[]>([]);
  const [stats, setStats] = useState<MoviesAdminStats | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(admin.referralCode);
  const [referralUrl, setReferralUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/movies/users');
      if (!res.ok) throw new Error('Failed to load subscribers.');
      const data = await res.json();
      setSubscribers(data.subscribers ?? []);
      setStats(data.stats ?? null);
      setReferralCode(data.referralCode ?? null);
      setReferralUrl(data.referralUrl ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSignOut() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  const filtered = subscribers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.customerName.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0d0f1a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0d0f1a]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">
                {isSuperAdmin ? 'Super Admin' : 'Movies Admin'}
              </p>
              <p className="font-semibold text-sm">{admin.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Referral code banner */}
        {referralCode && (
          <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4">
            <p className="text-xs text-indigo-300 uppercase tracking-wide mb-2 font-medium">
              Your Referral Code
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <code className="text-2xl font-bold text-white tracking-widest">{referralCode}</code>
              <CopyButton
                text={referralCode}
                label="Copy code"
                copyKey="referral-code"
              />
            </div>
            {referralUrl && (
              <div className="mt-2 flex items-center gap-2">
                <code className="text-xs text-indigo-300 truncate flex-1">{referralUrl}</code>
                <CopyButton
                  text={referralUrl}
                  label="Copy link"
                  copyKey="referral-url"
                />
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Share this code or link with subscribers — they&apos;ll be automatically assigned to
              your account.
            </p>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-indigo-400' },
              { label: 'Active', value: stats.activeUsers, icon: Signal, color: 'text-emerald-400' },
              { label: 'Pending', value: stats.pendingUsers, icon: Timer, color: 'text-yellow-400' },
              {
                label: 'Revenue',
                value: `KSh ${stats.totalRevenueKes.toLocaleString()}`,
                icon: Wallet,
                color: 'text-violet-400',
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-slate-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email…"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-2 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        )}

        {/* Subscribers list */}
        {!loading && (
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                {subscribers.length === 0
                  ? 'No subscribers yet. Share your referral code to get started.'
                  : 'No subscribers match your search.'}
              </div>
            )}
            {filtered.map((sub) => (
              <SubscriberCard key={sub.subscriptionId} subscriber={sub} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
