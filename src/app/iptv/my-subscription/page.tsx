'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Check,
  Copy,
  Loader2,
  Search,
  Tv,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wifi,
  X,
  Globe,
  Tag,
  Play,
} from 'lucide-react';

interface Credentials {
  m3uUrl: string;
  xtreamHost: string;
  xtreamUsername: string;
  xtreamPassword: string;
  xtreamPort: number;
}

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
  credentials?: Credentials;
  createdAt: string;
  expiresAt: string;
  activatedAt?: string;
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button type="button" onClick={copy} className="ml-2 shrink-0 text-violet-400 hover:text-violet-200 transition-colors">
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function StatusBadge({ status }: { status: Subscription['status'] }) {
  const map = {
    active: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    expired: 'bg-gray-100 text-gray-500',
  };
  const icons = {
    active: <CheckCircle2 className="h-3.5 w-3.5" />,
    pending: <Clock className="h-3.5 w-3.5" />,
    expired: <AlertCircle className="h-3.5 w-3.5" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${map[status]}`}>
      {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

type KodiStatus = 'idle' | 'connecting' | 'success' | 'error';
type RepoTab = 'country' | 'category';

interface RepoPlaylist {
  label: string;
  url: string;
  code: string;
}

function KodiModal({ m3uUrl, onClose }: { m3uUrl: string; onClose: () => void }) {
  // Connection fields
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('8080');
  const [username, setUsername] = useState('kodi');
  const [password, setPassword] = useState('');

  // Source tab: 'subscription' or 'repo'
  const [sourceTab, setSourceTab] = useState<'subscription' | 'repo'>('subscription');

  // Repo browser state
  const [repoTab, setRepoTab] = useState<RepoTab>('country');
  const [repoPlaylists, setRepoPlaylists] = useState<RepoPlaylist[]>([]);
  const [repoLoading, setRepoLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<RepoPlaylist | null>(null);

  // Push status
  const [status, setStatus] = useState<KodiStatus>('idle');
  const [message, setMessage] = useState('');

  const loadRepo = async (type: RepoTab) => {
    setRepoLoading(true);
    setSelectedRepo(null);
    try {
      const res = await fetch(`/api/iptv/repo-playlists?type=${type}`);
      const data = await res.json();
      setRepoPlaylists(data.playlists ?? []);
    } catch {
      setRepoPlaylists([]);
    } finally {
      setRepoLoading(false);
    }
  };

  const handleRepoTabChange = (tab: RepoTab) => {
    setRepoTab(tab);
    loadRepo(tab);
  };

  const handleSourceTabChange = (tab: 'subscription' | 'repo') => {
    setSourceTab(tab);
    setStatus('idle');
    setMessage('');
    if (tab === 'repo' && repoPlaylists.length === 0) {
      loadRepo('country');
    }
  };

  const pushToKodi = async (playlistUrl: string) => {
    if (!ip.trim()) {
      setStatus('error');
      setMessage('Enter your Kodi IP address first.');
      return;
    }

    setStatus('connecting');
    setMessage('');

    const base = `http://${ip.trim()}:${port}`;
    const auth = username ? btoa(`${username}:${password}`) : '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = `Basic ${auth}`;

    const rpc = (method: string, params?: object, id = 1) =>
      fetch(`${base}/jsonrpc`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ jsonrpc: '2.0', method, params, id }),
      });

    try {
      const ping = await rpc('JSONRPC.Ping');
      if (!ping.ok) throw new Error(`Kodi unreachable (HTTP ${ping.status})`);
      const pingData = await ping.json();
      if (pingData.result !== 'pong') throw new Error('Unexpected response from Kodi');

      const open = await rpc('Player.Open', { item: { file: playlistUrl } }, 2);
      const openData = await open.json();
      if (openData.error) throw new Error(openData.error.message ?? 'Failed to open playlist');

      setStatus('success');
      setMessage('Kodi is now loading your channels!');
    } catch (err) {
      setStatus('error');
      setMessage(
        err instanceof Error
          ? err.message
          : 'Could not connect. Check the IP and that Kodi remote control is enabled.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-violet-900 to-violet-700 p-5 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            <span className="font-bold">Connect to Kodi</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Kodi setup note */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <p className="font-semibold mb-1">One-time Kodi setup:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Go to <strong>Settings → Services → Control</strong></li>
              <li>Enable <strong>Allow remote control via HTTP</strong></li>
              <li>Enable <strong>Allow remote control from other systems</strong></li>
            </ol>
          </div>

          {/* Kodi connection fields */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Kodi IP Address</label>
              <input
                type="text"
                placeholder="e.g. 192.168.1.100"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Password (if set)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank if none"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Source tabs */}
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">What to play</p>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-semibold">
              <button
                type="button"
                onClick={() => handleSourceTabChange('subscription')}
                className={`flex-1 py-2 transition ${sourceTab === 'subscription' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                My Subscription
              </button>
              <button
                type="button"
                onClick={() => handleSourceTabChange('repo')}
                className={`flex-1 py-2 transition ${sourceTab === 'repo' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Free (iptv-org)
              </button>
            </div>
          </div>

          {/* Subscription tab */}
          {sourceTab === 'subscription' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Push your personal subscription playlist to Kodi.</p>
              {status === 'success' && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> {message}
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {message}
                </div>
              )}
              <Button
                type="button"
                onClick={() => pushToKodi(m3uUrl)}
                disabled={status === 'connecting'}
                className="w-full rounded-xl bg-violet-600 font-bold hover:bg-violet-700"
              >
                {status === 'connecting' ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting…</>
                ) : status === 'success' ? (
                  <><Check className="mr-2 h-4 w-4" /> Sent!</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" /> Push Subscription to Kodi</>
                )}
              </Button>
            </div>
          )}

          {/* Repo browser tab */}
          {sourceTab === 'repo' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Browse 8,000+ free channels from the{' '}
                <a href="https://github.com/iptv-org/iptv" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline">
                  iptv-org
                </a>{' '}
                public repo. Pick a playlist and push it to Kodi.
              </p>

              {/* Country / Category tabs */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRepoTabChange('country')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${repoTab === 'country' ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <Globe className="h-3.5 w-3.5" /> By Country
                </button>
                <button
                  type="button"
                  onClick={() => handleRepoTabChange('category')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${repoTab === 'category' ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <Tag className="h-3.5 w-3.5" /> By Category
                </button>
              </div>

              {/* Playlist grid */}
              {repoLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {repoPlaylists.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => setSelectedRepo(p)}
                      className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                        selectedRepo?.code === p.code
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-gray-200 text-gray-600 hover:border-violet-300 hover:bg-violet-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Status */}
              {status === 'success' && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> {message}
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {message}
                </div>
              )}

              <Button
                type="button"
                onClick={() => selectedRepo && pushToKodi(selectedRepo.url)}
                disabled={!selectedRepo || status === 'connecting'}
                className="w-full rounded-xl bg-violet-600 font-bold hover:bg-violet-700 disabled:opacity-50"
              >
                {status === 'connecting' ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Pushing…</>
                ) : status === 'success' ? (
                  <><Check className="mr-2 h-4 w-4" /> Sent!</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" />
                    {selectedRepo ? `Push "${selectedRepo.label}" to Kodi` : 'Select a playlist above'}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MySubscriptionPage() {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const toggleCurrency = () =>
    setCurrency((p) => (p.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' }));

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Subscription[] | null>(null);
  const [error, setError] = useState('');
  const [kodiSub, setKodiSub] = useState<Subscription | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const res = await fetch(`/api/iptv/lookup?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Lookup failed. Please try again.');
      } else {
        setResults(data.subscriptions ?? []);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      {kodiSub?.credentials && (
        <KodiModal m3uUrl={kodiSub.credentials.m3uUrl} onClose={() => setKodiSub(null)} />
      )}

      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white">
            <Tv className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black">My IPTV Subscription</h1>
          <p className="mt-2 text-gray-500">
            Enter your email address or phone number to retrieve your active subscription and credentials.
          </p>
        </div>

        {/* Lookup form */}
        <form onSubmit={handleLookup} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Email address or phone number (e.g. 0712345678)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none"
            />
            <Button type="submit" disabled={loading} className="rounded-xl bg-violet-600 px-6 font-bold hover:bg-violet-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* No results */}
        {results !== null && results.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
            <Tv className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-semibold">No subscriptions found</p>
            <p className="mt-1 text-sm">
              No IPTV subscriptions found for that email or phone. Make sure to use the email/phone you subscribed with.
            </p>
            <Link href="/iptv" className="mt-4 inline-block">
              <Button className="bg-violet-600 hover:bg-violet-700">Subscribe Now</Button>
            </Link>
          </div>
        )}

        {/* Results */}
        {results && results.length > 0 && (
          <div className="space-y-6">
            {results.map((sub) => (
              <div key={sub.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between bg-gradient-to-r from-violet-900 to-violet-800 p-5 text-white">
                  <div>
                    <p className="text-xs text-violet-300">Subscription ID</p>
                    <p className="font-mono text-sm font-bold">{sub.id}</p>
                    <p className="mt-1 text-lg font-black">{sub.planName} Plan</p>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>

                <div className="p-5">
                  {/* Details */}
                  <div className="mb-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-400">Customer</p>
                      <p className="font-semibold">{sub.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Amount Paid</p>
                      <p className="font-semibold text-emerald-600">KSh {sub.amountKes.toLocaleString()}</p>
                    </div>
                    {sub.mpesaReceipt && (
                      <div>
                        <p className="text-xs text-gray-400">M-Pesa Receipt</p>
                        <p className="font-mono text-xs font-bold text-emerald-700">{sub.mpesaReceipt}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400">Activated</p>
                      <p className="font-semibold">
                        {sub.activatedAt
                          ? new Date(sub.activatedAt).toLocaleDateString('en-KE')
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Expires</p>
                      <p className="font-semibold">
                        {new Date(sub.expiresAt).toLocaleDateString('en-KE', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Credentials */}
                  {sub.status === 'active' && sub.credentials ? (
                    <div>
                      <h3 className="mb-3 font-bold">IPTV Credentials</h3>
                      <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50 p-4">
                        {[
                          { label: 'M3U Playlist URL', value: sub.credentials.m3uUrl },
                          { label: 'Xtream Host', value: sub.credentials.xtreamHost },
                          { label: 'Username', value: sub.credentials.xtreamUsername },
                          { label: 'Password', value: sub.credentials.xtreamPassword },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-lg bg-white p-3">
                            <p className="mb-0.5 text-xs font-semibold text-gray-500">{label}</p>
                            <div className="flex items-center justify-between gap-2">
                              <span className="break-all font-mono text-xs text-violet-800">{value}</span>
                              <CopyBtn value={value} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Kodi connect button */}
                      <button
                        type="button"
                        onClick={() => setKodiSub(sub)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-violet-300 bg-violet-50 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                      >
                        <Wifi className="h-4 w-4" />
                        Connect to Kodi
                      </button>

                      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                        <p className="mb-1 font-semibold">Setup Guide:</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                          <li><strong>IPTV Smarters Pro</strong> or <strong>TiviMate</strong> — choose "Login with Xtream Codes API", then enter the Host, Username, and Password above</li>
                          <li><strong>Kodi</strong> — click "Connect to Kodi" above, or install <em>PVR IPTV Simple Client</em> and paste the M3U URL manually</li>
                          <li>Any other IPTV player — paste the M3U URL directly</li>
                        </ol>
                      </div>
                    </div>
                  ) : sub.status === 'pending' ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <AlertCircle className="mb-1 inline h-4 w-4" /> Payment is pending. If you completed payment and don&apos;t see credentials, please contact support.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
                      This subscription has expired.{' '}
                      <Link href="/iptv" className="text-violet-600 underline">Renew now</Link>
                    </div>
                  )}

                  {/* Support */}
                  <div className="mt-4 flex gap-3">
                    <a
                      href={`https://wa.me/254700123456?text=Hi! I need help with my IPTV subscription ${sub.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full rounded-xl border-green-500 text-green-700 text-xs hover:bg-green-50">
                        WhatsApp Support
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* First time? CTA */}
        {results === null && !loading && (
          <div className="mt-8 rounded-xl border border-violet-200 bg-violet-50 p-5 text-center text-sm text-violet-800">
            <p className="font-semibold">Don&apos;t have a subscription yet?</p>
            <p className="mt-1 text-xs">Get instant access to 20,000+ channels, PPV events, and 100,000+ movies.</p>
            <Link href="/iptv" className="mt-3 inline-block">
              <Button className="rounded-xl bg-violet-600 hover:bg-violet-700">Browse Plans</Button>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
