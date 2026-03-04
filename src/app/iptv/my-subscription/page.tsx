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

export default function MySubscriptionPage() {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const toggleCurrency = () =>
    setCurrency((p) => (p.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' }));

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Subscription[] | null>(null);
  const [error, setError] = useState('');

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

                      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                        <p className="mb-1 font-semibold">Setup Guide:</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                          <li>Download <strong>IPTV Smarters Pro</strong> or <strong>TiviMate</strong></li>
                          <li>Choose "Login with Xtream Codes API"</li>
                          <li>Enter the Host, Username, and Password above</li>
                          <li>Or paste the M3U URL into any IPTV player</li>
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
