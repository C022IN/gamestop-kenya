'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  History,
  KeyRound,
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

// ─── Lightweight toast ────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: 'success' | 'error' }

let _toastCounter = 0;
let _pushToast: ((msg: string, type?: 'success' | 'error') => void) | null = null;

function useToastStack() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++_toastCounter;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  }, []);
  _pushToast = push;
  return toasts;
}

function toast(message: string, type: 'success' | 'error' = 'success') {
  _pushToast?.(message, type);
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-sm transition-all ${
            t.type === 'error'
              ? 'bg-red-900/90 text-red-100 border border-red-700'
              : 'bg-gray-800/95 text-white border border-gray-600'
          }`}
        >
          {t.type === 'error' ? (
            <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}

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

interface DashboardCredentials {
  m3uUrl: string;
  xtreamHost: string;
  xtreamUsername: string;
  xtreamPassword: string;
  xtreamPort: number;
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
  credentials?: DashboardCredentials;
  playlistUrl?: string | null;
  assignedAdmin: AssignedAdmin | null;
}

interface Overview {
  customerCount: number;
  activeCustomerCount: number;
  pendingCustomerCount: number;
  expiredCustomerCount: number;
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

interface SubscriptionCoveragePeriod {
  startedAt: string;
  endedAt: string;
  subscriptionIds: string[];
  planNames: string[];
}

interface SubscriptionGap {
  startedAt: string;
  endedAt: string;
  durationDays: number;
}

interface SubscriptionBundle {
  key: string;
  profileId: string;
  customerName: string;
  email: string;
  phone: string;
  member?: {
    profileId: string;
    accessCode: string;
  };
  status: 'pending' | 'active' | 'expired';
  startedAt: string;
  latestActivityAt: string;
  latestSubscription: Subscription;
  subscriptions: Subscription[];
  periods: SubscriptionCoveragePeriod[];
  gaps: SubscriptionGap[];
  totalRevenueKes: number;
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
  bundles: SubscriptionBundle[];
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

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function roleLabel(role: AdminRole) {
  return role === 'super_admin' ? 'Super Admin' : 'Admin';
}

const PLAN_OPTIONS = [
  { id: '1wk',  name: '1 Week',     kes: 500 },
  { id: '1mo',  name: '1 Month',    kes: 1499 },
  { id: '3mo',  name: '3 Months',   kes: 4499 },
  { id: '12mo', name: '12 Months',  kes: 14999 },
  { id: '24mo', name: '24 Months',  kes: 22499 },
] as const;

type PlanId = typeof PLAN_OPTIONS[number]['id'];

function copyText(value: string, label = 'Copied') {
  navigator.clipboard.writeText(value).then(() => toast(label));
}

export default function AdminIptvDashboard({ admin }: AdminIptvDashboardProps) {
  const isSuper = admin.role === 'super_admin';
  const toasts = useToastStack();
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
  const [reprovisioning, setReprovisioning] = useState<string | null>(null);
  const [reprovisionMsg, setReprovisionMsg] = useState<
    Record<string, { tone: 'success' | 'error'; text: string }>
  >({});
  const [assignmentSelections, setAssignmentSelections] = useState<Record<string, string>>({});
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminType, setNewAdminType] = useState<'iptv' | 'catalog' | 'movies'>('iptv');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [createAdminMsg, setCreateAdminMsg] = useState('');

  // Grant access
  const [grantPhone, setGrantPhone] = useState('');
  const [grantName, setGrantName] = useState('');
  const [grantPlan, setGrantPlan] = useState<'1wk' | '1mo' | '3mo' | '12mo' | '24mo'>('1mo');
  const [granting, setGranting] = useState(false);
  const [grantResult, setGrantResult] = useState<{
    profileId: string;
    accessCode: string;
    phone: string;
    reusedExistingMember: boolean;
  } | null>(null);
  const [grantError, setGrantError] = useState('');
  const [renewingBundleKey, setRenewingBundleKey] = useState<string | null>(null);
  const [renewalMsg, setRenewalMsg] = useState<
    Record<string, { tone: 'success' | 'error'; text: string }>
  >({});
  const [changePlanSelections, setChangePlanSelections] = useState<Record<string, PlanId>>({});
  const [changingPlanKey, setChangingPlanKey] = useState<string | null>(null);

  // Impersonate
  const [impPhone, setImpPhone] = useState('');
  const [impersonating, setImpersonating] = useState(false);
  const [impResult, setImpResult] = useState<{ profileId: string; accessCode: string } | null>(null);
  const [impError, setImpError] = useState('');

  // Code generator
  const [codePlan, setCodePlan] = useState<'1wk' | '1mo' | '3mo' | '12mo' | '24mo'>('1mo');
  const [codeQty, setCodeQty] = useState(1);
  const [codeNote, setCodeNote] = useState('');
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<Array<{ code: string; planName: string }>>([]);
  const [codeGenError, setCodeGenError] = useState('');
  const [allCodes, setAllCodes] = useState<Array<{ code: string; planName: string; redeemedAt: string | null; redeemedByPhone: string | null; createdAt: string }>>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

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
      for (const bundle of node.bundles) {
        const subscription = bundle.latestSubscription;
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

  const handleReprovision = async (subscription: Subscription) => {
    setReprovisioning(subscription.id);
    setReprovisionMsg((prev) => ({
      ...prev,
      [subscription.id]: { tone: 'success', text: '' },
    }));

    try {
      const res = await fetch('/api/admin/iptv/reprovision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });

      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not reprovision credentials');
      }

      setReprovisionMsg((prev) => ({
        ...prev,
        [subscription.id]: {
          tone: 'success',
          text: data.message ?? 'Credentials reprovisioned.',
        },
      }));
      fetchDashboard(query.trim());
    } catch (err) {
      setReprovisionMsg((prev) => ({
        ...prev,
        [subscription.id]: {
          tone: 'error',
          text: err instanceof Error ? err.message : 'Could not reprovision credentials',
        },
      }));
    } finally {
      setReprovisioning(null);
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
          adminType: newAdminType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not create admin');
      }

      const typeLabel =
        newAdminType === 'catalog'
          ? 'Catalog Admin'
          : newAdminType === 'movies'
          ? 'Movies Admin'
          : 'IPTV Admin';
      setCreateAdminMsg(
        `Created ${data.admin.name} as ${typeLabel}. Referral code: ${data.admin.referralCode ?? 'N/A'}`
      );
      setNewAdminName('');
      setNewAdminPhone('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminType('iptv');
      fetchDashboard(query.trim());
    } catch (err) {
      setCreateAdminMsg(err instanceof Error ? err.message : 'Could not create admin');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrantError('');
    setGrantResult(null);
    setGranting(true);
    try {
      const payload = {
        phone: grantPhone,
        customerName: grantName.trim() || undefined,
        planId: grantPlan,
      };
      const res = await fetch('/api/admin/iptv/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Grant failed');
      setGrantResult({
        ...data.member,
        reusedExistingMember: Boolean(data.reusedExistingMember),
      });
      setGrantPhone('');
      setGrantName('');
      fetchDashboard(query.trim());
    } catch (err) {
      setGrantError(err instanceof Error ? err.message : 'Grant failed');
    } finally {
      setGranting(false);
    }
  };

  const handleRenewBundle = async (bundle: SubscriptionBundle) => {
    setRenewingBundleKey(bundle.key);
    setRenewalMsg((prev) => ({
      ...prev,
      [bundle.key]: { tone: 'success', text: '' },
    }));

    try {
      const res = await fetch('/api/admin/iptv/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: bundle.phone,
          planId: bundle.latestSubscription.planId,
        }),
      });

      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Renewal failed');
      }

      setRenewalMsg((prev) => ({
        ...prev,
        [bundle.key]: {
          tone: 'success',
          text: `Renewed on ${bundle.latestSubscription.planName}. Existing member access stayed in place.`,
        },
      }));
      setGrantResult({
        ...data.member,
        reusedExistingMember: Boolean(data.reusedExistingMember),
      });
      fetchDashboard(query.trim());
    } catch (err) {
      setRenewalMsg((prev) => ({
        ...prev,
        [bundle.key]: {
          tone: 'error',
          text: err instanceof Error ? err.message : 'Renewal failed',
        },
      }));
    } finally {
      setRenewingBundleKey(null);
    }
  };

  const handleChangePlan = async (bundle: SubscriptionBundle, planId: PlanId) => {
    const plan = PLAN_OPTIONS.find((p) => p.id === planId);
    if (!plan) return;
    setChangingPlanKey(bundle.key);
    try {
      const res = await fetch('/api/admin/iptv/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: bundle.phone, planId }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Plan change failed');
      toast(`Plan changed to ${plan.name} for ${bundle.customerName}`);
      setGrantResult({ ...data.member, reusedExistingMember: Boolean(data.reusedExistingMember) });
      fetchDashboard(query.trim());
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Plan change failed', 'error');
    } finally {
      setChangingPlanKey(null);
    }
  };

  const handleImpersonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setImpError('');
    setImpResult(null);
    setImpersonating(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: impPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Impersonate failed');
      setImpResult({ profileId: data.profileId, accessCode: data.accessCode });
    } catch (err) {
      setImpError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setImpersonating(false);
    }
  };

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeGenError('');
    setGeneratedCodes([]);
    setGeneratingCodes(true);
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: codePlan, quantity: codeQty, note: codeNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate codes');
      setGeneratedCodes(data.codes);
      // Refresh the list
      const listRes = await fetch('/api/admin/codes');
      const listData = await listRes.json();
      setAllCodes(listData.codes ?? []);
    } catch (err) {
      setCodeGenError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setGeneratingCodes(false);
    }
  };

  const loadAllCodes = useCallback(async () => {
    setLoadingCodes(true);
    try {
      const res = await fetch('/api/admin/codes');
      const data = await res.json();
      setAllCodes(data.codes ?? []);
    } catch {} finally {
      setLoadingCodes(false);
    }
  }, []);

  const visibleAdminOptions = useMemo(
    () => admins.map((teamAdmin) => ({ id: teamAdmin.id, label: `${teamAdmin.name} (${roleLabel(teamAdmin.role)})` })),
    [admins]
  );

  const renderSubscriptionRows = (bundles: SubscriptionBundle[]) => {
    if (bundles.length === 0) {
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
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Journey</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Latest receipt</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-950">
            {bundles.map((bundle) => {
              const subscription = bundle.latestSubscription;
              const latestCoveredPeriod = bundle.periods[bundle.periods.length - 1];
              const assignmentKey = subscription.id;

              return (
              <tr key={bundle.key} className="transition hover:bg-gray-900/60">
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold text-white">{bundle.customerName}</p>
                  <p className="text-xs text-gray-400">{bundle.email}</p>
                  <p className="text-xs text-gray-500">{bundle.phone}</p>
                  {bundle.member && (
                    <p className="text-xs text-red-300 mt-0.5">
                      Code: <span className="font-mono text-red-200">{bundle.member.accessCode}</span>
                    </p>
                  )}
                  {subscription.credentials ? (
                    <div className="mt-2 rounded-lg border border-sky-900/40 bg-sky-950/20 px-2.5 py-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-400 mb-1">TV Credentials</p>
                      {[
                        { label: 'M3U', value: subscription.playlistUrl ?? subscription.credentials.m3uUrl },
                        { label: 'Host', value: subscription.credentials.xtreamHost },
                        { label: 'User', value: subscription.credentials.xtreamUsername },
                        { label: 'Pass', value: subscription.credentials.xtreamPassword },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center gap-1.5 py-0.5">
                          <span className="text-[10px] text-sky-400/60 w-7 shrink-0">{label}</span>
                          <span className="font-mono text-[10px] text-sky-100 truncate flex-1 max-w-[140px]">{value}</span>
                          <button type="button" onClick={() => copyText(value, `${label} copied`)} className="text-sky-400/50 hover:text-sky-200 shrink-0">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : bundle.status === 'active' ? (
                    <p className="mt-1 text-xs text-amber-300">No credentials yet — reprovision to issue.</p>
                  ) : null}
                  <p className="mt-1 text-[10px] text-gray-600">
                    Since {formatDateLabel(bundle.startedAt)} · {pluralize(bundle.subscriptions.length, 'period')} · <span className="font-mono">{bundle.profileId.slice(0, 10)}…</span>
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold">{subscription.planName}</p>
                  <p className="text-xs text-gray-400">{formatKes(subscription.amountKes)} latest | {formatKes(bundle.totalRevenueKes)} total</p>
                  <p className="text-xs text-gray-500">Created {formatDateLabel(subscription.createdAt)} · Expires {formatDateLabel(subscription.expiresAt)}</p>
                  <div className="mt-2 space-y-1.5">
                    <div>
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">Coverage · </span>
                      {bundle.periods.length > 0 ? (
                        <span className="text-xs text-gray-300">
                          {formatDateLabel(bundle.periods[0].startedAt)} – {formatDateLabel(bundle.periods[bundle.periods.length - 1].endedAt)}
                          {bundle.periods.length > 1 && <span className="text-gray-500"> · {bundle.periods.length} blocks</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Pending</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">Skipped · </span>
                      {bundle.gaps.length > 0 ? (
                        <span className="text-xs text-amber-300">{bundle.gaps.length} {bundle.gaps.length === 1 ? 'gap' : 'gaps'}</span>
                      ) : (
                        <span className="text-xs text-emerald-400">None</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[bundle.status]}`}
                  >
                    {STATUS_ICON[bundle.status]}
                    {bundle.status.charAt(0).toUpperCase() + bundle.status.slice(1)}
                  </span>
                  <p className="mt-2 text-xs text-gray-500">
                    {bundle.status === 'active'
                      ? latestCoveredPeriod
                        ? `Access tracked through ${formatDateLabel(latestCoveredPeriod.endedAt)}.`
                        : 'Access is currently live.'
                      : bundle.status === 'pending'
                        ? 'Latest period is waiting for activation.'
                        : latestCoveredPeriod
                          ? `Last access ended ${formatDateLabel(latestCoveredPeriod.endedAt)}.`
                          : 'No active coverage on record.'}
                  </p>
                </td>
                <td className="px-4 py-3 align-top font-mono text-xs text-emerald-400">
                  <p>{subscription.mpesaReceipt ?? '-'}</p>
                  <p className="mt-1 text-gray-500">{pluralize(bundle.subscriptions.length, 'receipt')} tracked</p>
                  <p className="mt-0.5 text-[10px] text-gray-600">{subscription.id}</p>
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
                        value={assignmentSelections[assignmentKey] ?? subscription.assignedAdmin?.id ?? ''}
                        onChange={(event) =>
                          setAssignmentSelections((prev) => ({
                            ...prev,
                            [assignmentKey]: event.target.value,
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
                        disabled={assigning === assignmentKey}
                        onClick={() => handleAssign(subscription)}
                        className="rounded-lg border-violet-500/40 bg-transparent text-violet-200 hover:bg-violet-950"
                      >
                        {assigning === assignmentKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Assign'}
                      </Button>
                      {assignmentMsg[assignmentKey] && (
                        <p className="text-xs text-emerald-400">{assignmentMsg[assignmentKey]}</p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 align-top">
                  {bundle.status !== 'active' && subscription.status === 'pending' ? (
                    /* ── Pending: Activate ── */
                    <div>
                      <button
                        type="button"
                        onClick={() => handleActivate(subscription)}
                        disabled={activating === assignmentKey}
                        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
                      >
                        {activating === assignmentKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                        Activate
                      </button>
                      {activateMsg[assignmentKey] && (
                        <p className="mt-1 text-xs text-emerald-400">{activateMsg[assignmentKey]}</p>
                      )}
                    </div>
                  ) : bundle.status === 'expired' ? (
                    /* ── Expired: Renew same plan + Change plan ── */
                    <div className="space-y-2">
                      {isSuper ? (
                        <>
                          {/* Renew same plan */}
                          <button
                            type="button"
                            onClick={() => handleRenewBundle(bundle)}
                            disabled={renewingBundleKey === bundle.key || changingPlanKey === bundle.key}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-gray-950 hover:bg-amber-400 disabled:opacity-50"
                          >
                            {renewingBundleKey === bundle.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                            Renew ({bundle.latestSubscription.planName})
                          </button>
                          {/* Change plan */}
                          <div className="flex gap-1.5">
                            <select
                              value={changePlanSelections[bundle.key] ?? bundle.latestSubscription.planId}
                              onChange={(e) => setChangePlanSelections((p) => ({ ...p, [bundle.key]: e.target.value as PlanId }))}
                              className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                            >
                              {PLAN_OPTIONS.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} — KSh {p.kes.toLocaleString()}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleChangePlan(bundle, changePlanSelections[bundle.key] ?? bundle.latestSubscription.planId as PlanId)}
                              disabled={changingPlanKey === bundle.key || renewingBundleKey === bundle.key}
                              className="rounded-lg border border-violet-500/40 bg-violet-950/60 px-2.5 py-1.5 text-xs font-bold text-violet-200 hover:bg-violet-900 disabled:opacity-50"
                            >
                              {changingPlanKey === bundle.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Switch'}
                            </button>
                          </div>
                          {renewalMsg[bundle.key]?.text && (
                            <p className={`text-xs ${renewalMsg[bundle.key]?.tone === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                              {renewalMsg[bundle.key]?.text}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-amber-300">Renewal required</span>
                      )}
                    </div>
                  ) : (
                    /* ── Active: Reprovision + Change plan (SA only) ── */
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleReprovision(subscription)}
                        disabled={reprovisioning === assignmentKey}
                        className="flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-950/40 px-3 py-1.5 text-xs font-bold text-sky-100 hover:bg-sky-950/70 disabled:opacity-50"
                      >
                        {reprovisioning === assignmentKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        {subscription.credentials ? 'Reprovision' : 'Issue credentials'}
                      </button>
                      {reprovisionMsg[assignmentKey]?.text && (
                        <p className={`text-xs ${reprovisionMsg[assignmentKey]?.tone === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {reprovisionMsg[assignmentKey]?.text}
                        </p>
                      )}
                      {isSuper && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-gray-600 mb-1">Change / Upgrade plan</p>
                          <div className="flex gap-1.5">
                            <select
                              value={changePlanSelections[bundle.key] ?? bundle.latestSubscription.planId}
                              onChange={(e) => setChangePlanSelections((p) => ({ ...p, [bundle.key]: e.target.value as PlanId }))}
                              className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                            >
                              {PLAN_OPTIONS.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} — KSh {p.kes.toLocaleString()}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleChangePlan(bundle, changePlanSelections[bundle.key] ?? bundle.latestSubscription.planId as PlanId)}
                              disabled={changingPlanKey === bundle.key}
                              className="rounded-lg border border-violet-500/40 bg-violet-950/60 px-2.5 py-1.5 text-xs font-bold text-violet-200 hover:bg-violet-900 disabled:opacity-50"
                            >
                              {changingPlanKey === bundle.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-600 mt-1">Starts a new subscription period.</p>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <ToastStack toasts={toasts} />
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
                ? 'See every admin, grouped customer histories, and the phone-plus-code format under each admin.'
                : 'See the grouped customer histories assigned to you, with phone numbers, codes, and payment status.'}
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
                asChild
                type="button"
                variant="outline"
                className="rounded-xl border-sky-500/40 bg-transparent text-sky-200 hover:bg-sky-950"
              >
                <Link href="/admin/catalog">
                  Catalog Media
                </Link>
              </Button>
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

        {/* ── Super-admin power tools ── */}
        {isSuper && (
          <div className="mb-8 grid gap-4 md:grid-cols-2">

            {/* Grant Access */}
            <div className="rounded-2xl border border-violet-800/40 bg-violet-950/20 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-violet-400" />
                <h2 className="font-bold text-white">Grant Access</h2>
                <span className="ml-auto text-xs text-violet-400">No M-Pesa needed</span>
              </div>
              <form onSubmit={handleGrant} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Phone (e.g. 0712345678)"
                  value={grantPhone}
                  onChange={(e) => setGrantPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Customer name for new user only"
                  value={grantName}
                  onChange={(e) => setGrantName(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                />
                <select
                  value={grantPlan}
                  onChange={(e) => setGrantPlan(e.target.value as '1wk' | '1mo' | '3mo' | '12mo' | '24mo')}
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="1wk">1 Week — KSh 500</option>
                  <option value="1mo">1 Month — KSh 1,499</option>
                  <option value="3mo">3 Months — KSh 4,499</option>
                  <option value="12mo">12 Months — KSh 14,999</option>
                  <option value="24mo">24 Months — KSh 22,499</option>
                </select>
                {grantError && <p className="text-xs text-red-400">{grantError}</p>}
                <Button type="submit" disabled={granting} className="w-full rounded-xl bg-violet-600 font-bold hover:bg-violet-700">
                  {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  <span className="ml-2">{granting ? 'Granting…' : 'Grant & Activate'}</span>
                </Button>
              </form>
              {grantResult ? (
                <div className="mt-3 rounded-xl border border-emerald-700 bg-emerald-950/40 p-4 text-sm">
                  <p className="font-bold text-emerald-300">
                    {grantResult.reusedExistingMember ? 'Renewal granted!' : 'Access granted!'}
                  </p>
                  <p className="mt-1 text-gray-300">
                    Phone: <span className="font-mono text-white">{grantResult.phone}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-gray-300">
                      Access Code:{' '}
                      <span className="font-mono text-xl font-black text-emerald-300">
                        {grantResult.accessCode}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(grantResult.accessCode)}
                      className="text-gray-500 hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {grantResult.reusedExistingMember ? (
                      'Existing member profile kept the same phone and access code.'
                    ) : (
                      <>
                        User logs in at <span className="text-violet-300">/movies/login</span> with
                        their phone + code above.
                      </>
                    )}
                  </p>
                </div>
              ) : null}
              {false && grantResult && (
                <div className="mt-3 rounded-xl border border-emerald-700 bg-emerald-950/40 p-4 text-sm">
                  <p className="font-bold text-emerald-300">✓ Access granted!</p>
                  <p className="mt-1 text-gray-300">Phone: <span className="font-mono text-white">{grantResult!.phone}</span></p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-gray-300">Access Code: <span className="font-mono text-xl font-black text-emerald-300">{grantResult!.accessCode}</span></p>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(grantResult!.accessCode)}
                      className="text-gray-500 hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    User logs in at <span className="text-violet-300">/movies/login</span> with their phone + code above.
                  </p>
                </div>
              )}
            </div>

            {/* Impersonate / Login as user */}
            <div className="rounded-2xl border border-sky-800/40 bg-sky-950/20 p-5">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-sky-400" />
                <h2 className="font-bold text-white">Login as User</h2>
                <span className="ml-auto text-xs text-sky-400">Super admin only</span>
              </div>
              <form onSubmit={handleImpersonate} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Phone (e.g. 0712345678)"
                  value={impPhone}
                  onChange={(e) => setImpPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                />
                {impError && <p className="text-xs text-red-400">{impError}</p>}
                <Button type="submit" disabled={impersonating} className="w-full rounded-xl bg-sky-600 font-bold hover:bg-sky-700">
                  {impersonating ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  <span className="ml-2">{impersonating ? 'Opening session…' : 'Login as this User'}</span>
                </Button>
              </form>
              {impResult && (
                <div className="mt-3 rounded-xl border border-sky-700 bg-sky-950/40 p-4 text-sm">
                  <p className="font-bold text-sky-300">✓ Session created!</p>
                  <p className="mt-1 text-gray-300">Member ID: <span className="font-mono text-white">{impResult.profileId}</span></p>
                  <p className="mt-1 text-gray-300">Access Code: <span className="font-mono font-bold text-sky-300">{impResult.accessCode}</span></p>
                  <a
                    href="/movies"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700"
                  >
                    Open Member Hub as this User →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {overview && (
          <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: isSuper ? 'All Users' : 'Your Users',
                value: overview.customerCount.toLocaleString(),
                note: `${overview.totalSubscriptions} subscription periods tracked | ${overview.activeCustomerCount} active`,
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
                note: query.trim() ? 'Bundled user histories' : 'Current user scope',
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
            {/* ── Code Generator ── */}
            <section className="mb-6 rounded-2xl border border-amber-800/40 bg-amber-950/10 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Access Code Generator</h2>
                  <p className="text-sm text-gray-400">Generate voucher codes — Weekly, Monthly, or Yearly. Share the code; the user activates it themselves.</p>
                </div>
                <button
                  type="button"
                  onClick={loadAllCodes}
                  className="ml-auto flex items-center gap-1.5 rounded-xl border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
                >
                  {loadingCodes ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  View all codes
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Generator form */}
                <form onSubmit={handleGenerateCodes} className="space-y-3">
                  <select
                    value={codePlan}
                    onChange={(e) => setCodePlan(e.target.value as typeof codePlan)}
                    className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="1wk">1 Week — KSh 500</option>
                    <option value="1mo">1 Month — KSh 1,499</option>
                    <option value="3mo">3 Months — KSh 4,499</option>
                    <option value="12mo">12 Months — KSh 14,999</option>
                    <option value="24mo">24 Months — KSh 22,499</option>
                  </select>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={codeQty}
                      onChange={(e) => setCodeQty(Number(e.target.value))}
                      className="w-24 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Note (optional, e.g. Promo batch 1)"
                      value={codeNote}
                      onChange={(e) => setCodeNote(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  {codeGenError && <p className="text-xs text-red-400">{codeGenError}</p>}
                  <button
                    type="submit"
                    disabled={generatingCodes}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-gray-950 hover:bg-amber-400 disabled:opacity-50"
                  >
                    {generatingCodes ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    Generate {codeQty} Code{codeQty > 1 ? 's' : ''}
                  </button>
                </form>

                {/* Generated results */}
                <div>
                  {generatedCodes.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-amber-300">Generated codes — share with customers:</p>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(generatedCodes.map((c) => `${c.code} (${c.planName})`).join('\n'))}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                        >
                          <Copy className="h-3.5 w-3.5" /> Copy all
                        </button>
                      </div>
                      <div className="max-h-48 space-y-1.5 overflow-y-auto">
                        {generatedCodes.map((c) => (
                          <div key={c.code} className="flex items-center justify-between rounded-xl border border-amber-800/30 bg-amber-950/30 px-3 py-2">
                            <span className="font-mono text-base font-black text-amber-300">{c.code}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{c.planName}</span>
                              <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(c.code)}
                                className="text-gray-500 hover:text-amber-300"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-700 p-6 text-center text-sm text-gray-500">
                      Generated codes will appear here.<br />Share them directly with subscribers.
                    </div>
                  )}
                </div>
              </div>

              {/* All codes table */}
              {allCodes.length > 0 && (
                <div className="mt-5 overflow-hidden rounded-xl border border-gray-800">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-900 text-gray-400">
                      <tr>
                        <th className="px-3 py-2 text-left">Code</th>
                        <th className="px-3 py-2 text-left">Plan</th>
                        <th className="px-3 py-2 text-left">Created</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Redeemed by</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 bg-gray-950">
                      {allCodes.map((c) => (
                        <tr key={c.code}>
                          <td className="px-3 py-2 font-mono font-bold text-amber-300">{c.code}</td>
                          <td className="px-3 py-2 text-white">{c.planName}</td>
                          <td className="px-3 py-2 text-gray-400">
                            {new Date(c.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-3 py-2">
                            {c.redeemedAt ? (
                              <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-emerald-400">Redeemed</span>
                            ) : (
                              <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-amber-300">Available</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-400">{c.redeemedByPhone ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

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
                  <p className="text-sm text-gray-400">Add an IPTV, Catalog, or Movies admin with their own scoped dashboard and referral code.</p>
                </div>
              </div>

              {/* Admin type selector */}
              <div className="mb-3 flex gap-2">
                {([
                  { value: 'iptv', label: 'IPTV Admin', desc: 'Manages IPTV subscribers' },
                  { value: 'catalog', label: 'Catalog Admin', desc: 'Lists products + tracking links' },
                  { value: 'movies', label: 'Movies Admin', desc: 'Views referred subscribers' },
                ] as const).map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNewAdminType(value)}
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      newAdminType === value
                        ? 'border-violet-500 bg-violet-500/10 text-white'
                        : 'border-gray-700 bg-gray-950 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </button>
                ))}
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
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={newAdminEmail}
                  onChange={(event) => setNewAdminEmail(event.target.value)}
                  className="rounded-xl border border-gray-700 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={newAdminPhone}
                  onChange={(event) => setNewAdminPhone(event.target.value)}
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
                ? 'Each section shows the admin and the bundled customer histories assigned under them.'
                : 'These are the bundled customer histories assigned to your account.'}
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
                      <p className="mt-1 font-bold text-white">{node.stats.customerCount}</p>
                    </div>
                    <div className="rounded-lg bg-gray-900 p-3">
                      <p className="text-gray-500">Active</p>
                      <p className="mt-1 font-bold text-white">{node.stats.activeCustomerCount}</p>
                    </div>
                    <div className="rounded-lg bg-gray-900 p-3">
                      <p className="text-gray-500">Revenue</p>
                      <p className="mt-1 font-bold text-white">{formatKes(node.stats.totalRevenueKes)}</p>
                    </div>
                  </div>
                </div>

                {renderSubscriptionRows(node.bundles)}
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
