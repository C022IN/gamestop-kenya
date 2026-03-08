'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { DEVICE_ONBOARDING_GUIDES } from '@/lib/iptv-product';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Monitor,
  Smartphone,
  Shield,
  Tablet,
  Tv,
  XCircle,
  Phone,
  PlayCircle,
} from 'lucide-react';

const PLANS = {
  '3mo':  { id: '3mo',  name: '3 Months',  months: 3,  kesPrice: 4499,  usdPrice: 29.99,  badge: 'Save 67%' },
  '12mo': { id: '12mo', name: '12 Months', months: 12, kesPrice: 14999, usdPrice: 99.99,  badge: 'Best Value – Save 75%', popular: true },
  '24mo': { id: '24mo', name: '24 Months', months: 24, kesPrice: 22499, usdPrice: 149.99, badge: 'Max Savings – Save 80%' },
} as const;

type PlanId = keyof typeof PLANS;

interface Credentials {
  m3uUrl: string;
  xtreamHost: string;
  xtreamUsername: string;
  xtreamPassword: string;
  xtreamPort: number;
}

interface ActivatedSubscription {
  id: string;
  planName: string;
  months: number;
  amountKes: number;
  customerName: string;
  email: string;
  phone: string;
  mpesaReceipt?: string;
  credentials?: Credentials;
  expiresAt: string;
}

interface MemberCredentials {
  profileId: string;
  accessCode: string;
}

const deviceIcons = {
  tv: Tv,
  mobile: Smartphone,
  web: Monitor,
  box: Tablet,
} as const;

type MpesaPhase =
  | { phase: 'idle' }
  | { phase: 'sending' }
  | { phase: 'waiting'; checkoutRequestId: string; subscriptionId: string; msg: string }
  | { phase: 'confirming' }
  | { phase: 'success'; subscription: ActivatedSubscription; member: MemberCredentials }
  | { phase: 'failed'; reason: string };

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

export default function IPTVSubscribePage() {
  const { planId } = useParams<{ planId: string }>();
  const plan = PLANS[planId as PlanId];

  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const toggleCurrency = () =>
    setCurrency((p) => (p.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' }));

  const [phone, setPhone] = useState('');
  const [mpesaState, setMpesaState] = useState<MpesaPhase>({ phase: 'idle' });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Invalid plan selected.</p>
          <Link href="/iptv"><Button>Back to IPTV Plans</Button></Link>
        </div>
      </div>
    );
  }

  const displayPrice = currency.code === 'USD'
    ? `$${plan.usdPrice.toFixed(2)}`
    : `KSh ${plan.kesPrice.toLocaleString()}`;

  const startPolling = (checkoutRequestId: string, subscriptionId: string) => {
    let attempts = 0;
    const maxAttempts = 24;

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/mpesa/status?id=${checkoutRequestId}`);
        const data = await res.json();

        if (data.status === 'success') {
          clearInterval(pollRef.current!);
          setMpesaState({ phase: 'confirming' });

          // Confirm and provision credentials
          const confRes = await fetch('/api/iptv/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkoutRequestId }),
          });
          const confData = await confRes.json();

          if (!confRes.ok || confData.error) {
            setMpesaState({ phase: 'failed', reason: confData.error ?? 'Activation failed. Please contact support.' });
            return;
          }

          setMpesaState({
            phase: 'success',
            subscription: confData.subscription,
            member: confData.member,
          });
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current!);
          setMpesaState({ phase: 'failed', reason: data.resultDesc ?? 'Payment was not completed.' });
        } else if (attempts >= maxAttempts) {
          clearInterval(pollRef.current!);
          setMpesaState({ phase: 'failed', reason: 'Payment timed out. If you were charged, contact support with your phone number.' });
        }
      } catch {
        // keep polling on network error
      }
    }, 5000);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setMpesaState({ phase: 'sending' });

    try {
      const res = await fetch('/api/iptv/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, phone }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setMpesaState({ phase: 'failed', reason: data.error ?? 'Failed to initiate payment.' });
        return;
      }

      setMpesaState({
        phase: 'waiting',
        checkoutRequestId: data.checkoutRequestId,
        subscriptionId: data.subscriptionId,
        msg: data.customerMessage ?? 'Check your phone for the M-Pesa prompt.',
      });

      startPolling(data.checkoutRequestId, data.subscriptionId);
    } catch {
      setMpesaState({ phase: 'failed', reason: 'Network error. Please check your connection.' });
    }
  };

  const isSuccess = mpesaState.phase === 'success';
  const sub = isSuccess ? mpesaState.subscription : null;
  const member = isSuccess ? mpesaState.member : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      <div className="container mx-auto max-w-5xl px-4 py-10">
        <Link href="/iptv">
          <Button variant="ghost" size="sm" className="mb-6 flex items-center gap-2 text-gray-500">
            <ArrowLeft className="h-4 w-4" /> Back to Plans
          </Button>
        </Link>

        {!isSuccess ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
            {/* Left: Form */}
            <div className="md:col-span-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
                <h1 className="mb-1 text-2xl font-black">Subscribe to IPTV</h1>
                <p className="mb-6 text-sm text-gray-500">Enter your M-Pesa number, complete payment, and your login details will appear on this page.</p>

                {(mpesaState.phase === 'idle' || mpesaState.phase === 'failed') && (
                  <form onSubmit={handleSubscribe} className="space-y-5">
                    {mpesaState.phase === 'failed' && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                        <div>
                          <p className="text-sm font-semibold text-red-800">Payment failed</p>
                          <p className="mt-0.5 text-xs text-red-700">{mpesaState.reason}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        <Phone className="mr-1.5 inline h-4 w-4 text-gray-400" />M-Pesa Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0717 402 034"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-400">Use the same number you will use later to sign in.</p>
                    </div>

                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                      <p className="mb-1 font-semibold">How payment works:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Click "Pay {displayPrice} with M-Pesa" below</li>
                        <li>A pop-up appears on your phone</li>
                        <li>Enter your M-Pesa PIN to confirm</li>
                        <li>Your movie code and TV app details appear on this page</li>
                      </ol>
                    </div>

                    <Button
                      type="submit"
                      className="w-full rounded-xl bg-violet-600 py-6 text-base font-bold hover:bg-violet-700"
                    >
                      <Smartphone className="mr-2 h-5 w-5" />
                      Pay {displayPrice} with M-Pesa
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                      <Shield className="h-3.5 w-3.5" /> Secure payment via Safaricom Daraja
                    </div>
                  </form>
                )}

                {mpesaState.phase === 'sending' && (
                  <div className="py-12 text-center">
                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-violet-600" />
                    <p className="font-semibold text-gray-800">Sending M-Pesa prompt...</p>
                    <p className="mt-1 text-sm text-gray-500">Please wait a moment.</p>
                  </div>
                )}

                {mpesaState.phase === 'waiting' && (
                  <div className="space-y-5 py-6 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                      <Smartphone className="h-10 w-10 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900">Check your phone!</p>
                      <p className="mt-1 text-sm text-gray-500">{mpesaState.msg}</p>
                    </div>
                    <div className="mx-auto max-w-xs rounded-xl border border-green-200 bg-green-50 p-4 text-left text-sm text-green-800">
                      <p className="font-semibold">Enter your M-Pesa PIN to pay:</p>
                      <p className="mt-1 text-2xl font-black text-green-700">{displayPrice}</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Waiting for confirmation...
                    </div>
                    <button
                      type="button"
                      onClick={() => setMpesaState({ phase: 'idle' })}
                      className="text-xs text-gray-400 underline hover:text-red-500"
                    >
                      Cancel and try again
                    </button>
                  </div>
                )}

                {mpesaState.phase === 'confirming' && (
                  <div className="py-12 text-center">
                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-violet-600" />
                    <p className="font-semibold text-gray-800">Payment confirmed. Preparing your access...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Plan summary */}
            <div className="md:col-span-2">
              <div className="sticky top-24 rounded-2xl border border-violet-200 bg-gradient-to-b from-violet-900 to-violet-950 p-6 text-white shadow-lg">
                <div className="mb-1 inline-block rounded bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                  {plan.badge}
                </div>
                <h2 className="mt-2 text-2xl font-black">{plan.name}</h2>
                <p className="mt-1 text-4xl font-extrabold">{displayPrice}</p>
                <p className="mb-4 text-sm text-violet-300">
                  {currency.code === 'USD'
                    ? `$${(plan.usdPrice / plan.months).toFixed(2)}/mo`
                    : `KSh ${Math.round(plan.kesPrice / plan.months).toLocaleString()}/mo`}
                </p>

                <ul className="mb-5 space-y-2">
                  {[
                    '20,000+ live channels',
                    'PPV events included',
                    '100,000+ movies & series',
                    'EPG + catch-up',
                    'M-Pesa & card accepted',
                    'WhatsApp setup support',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="rounded-xl border border-violet-600/40 bg-violet-800/40 p-3 text-xs text-violet-200">
                  <Tv className="mb-1 h-4 w-4 text-violet-300" />
                  Your login details show right after payment. Works on Smart TV, Firestick, Android, iPhone, and more.
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ─── SUCCESS STATE ─── */
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="mb-5 flex flex-col items-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-black text-gray-900">You&apos;re Ready to Watch</h1>
                <p className="mt-2 text-gray-500">
                  Your login details are ready. Save them before leaving this page.
                </p>
              </div>

              {/* Order summary */}
              <div className="mb-6 rounded-xl bg-gray-50 p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-mono font-bold">{sub!.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone Number</span>
                  <span className="font-mono font-bold">{member!.profileId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-semibold">{sub!.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="font-bold text-emerald-600">KSh {sub!.amountKes.toLocaleString()}</span>
                </div>
                {sub!.mpesaReceipt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">M-Pesa Receipt</span>
                    <span className="font-mono font-bold text-emerald-700">{sub!.mpesaReceipt}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Expires</span>
                  <span className="font-semibold">{new Date(sub!.expiresAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="mb-3 text-lg font-bold">Your Movie Sign-In Details</h2>
                <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4">
                  {[
                    { label: 'Phone Number', value: member!.profileId },
                    { label: 'Movie Code', value: member!.accessCode },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-white p-3">
                      <p className="mb-0.5 text-xs font-semibold text-gray-500">{label}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="break-all font-mono text-xs text-red-800">{value}</span>
                        <CopyBtn value={value} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  You are already signed in on this device. Use these details the next time you open GameStop Movies.
                </p>
              </div>

              {/* Credentials */}
              {sub!.credentials && (
                <div className="mb-6">
                  <h2 className="mb-3 text-lg font-bold">Your TV App Details</h2>
                  <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50 p-4">
                    {[
                      { label: 'Playlist Link', value: sub!.credentials.m3uUrl },
                      { label: 'Server', value: sub!.credentials.xtreamHost },
                      { label: 'Username', value: sub!.credentials.xtreamUsername },
                      { label: 'Password', value: sub!.credentials.xtreamPassword },
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
                  <p className="mt-2 text-xs text-gray-400">
                    Save these details now. If you need help later, contact support with your phone number or M-Pesa receipt.
                  </p>
                </div>
              )}

              {/* Setup instructions */}
              <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <p className="mb-2 font-semibold">Quick Setup:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Download <strong>IPTV Smarters Pro</strong> or <strong>TiviMate</strong> on your device</li>
                  <li>Select the server or Xtream login option inside the app</li>
                  <li>Enter the server, username, and password shown above</li>
                  <li>Or paste the playlist link into any compatible player</li>
                </ol>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {DEVICE_ONBOARDING_GUIDES.map((guide) => {
                    const Icon = deviceIcons[guide.platform];
                    return (
                      <div key={guide.id} className="rounded-xl bg-white p-4">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">
                          {guide.title}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{guide.app}</p>
                        <ul className="mt-3 space-y-1 text-xs text-gray-600">
                          {guide.steps.map((step) => (
                            <li key={step} className="flex items-start gap-2">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/movies" className="flex-1">
                  <Button className="w-full rounded-xl bg-red-600 hover:bg-red-700">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Open My Movies
                  </Button>
                </Link>
                <a
                  href={`https://wa.me/254717402034?text=Hi! I need help setting up my IPTV. Subscription ID: ${sub!.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full rounded-xl border-green-500 text-green-700 hover:bg-green-50">
                    WhatsApp Setup Help
                  </Button>
                </a>
                <Link href="/iptv" className="flex-1 sm:flex-none">
                  <Button variant="outline" className="w-full rounded-xl border-violet-300 text-violet-700 hover:bg-violet-50">
                    Back to Plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
