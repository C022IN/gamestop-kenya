'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useStoreCurrency } from '@/domains/storefront/hooks/useStoreCurrency';
import { DEVICE_ONBOARDING_GUIDES } from '@/lib/iptv-guides';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
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
  '3mo': { id: '3mo', name: '3 Months', months: 3, kesPrice: 4499, usdPrice: 29.99, badge: 'Starter' },
  '12mo': {
    id: '12mo',
    name: '12 Months',
    months: 12,
    kesPrice: 14999,
    usdPrice: 99.99,
    badge: 'Best Value',
    popular: true,
  },
  '24mo': {
    id: '24mo',
    name: '24 Months',
    months: 24,
    kesPrice: 22499,
    usdPrice: 149.99,
    badge: 'Long-Term',
  },
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

interface BillingSummary {
  currency: string;
  taxKes: number;
  chargedKes: number;
}

interface ActivationState {
  subscription: ActivatedSubscription;
  member: MemberCredentials;
  billing: BillingSummary;
  paymentLabel: 'M-Pesa' | 'Stripe' | 'Free Checkout';
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
  | { phase: 'waiting'; checkoutRequestId: string; msg: string }
  | { phase: 'confirming' }
  | { phase: 'failed'; reason: string };

type StripePhase =
  | { phase: 'idle' }
  | { phase: 'redirecting' }
  | { phase: 'verifying' }
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

function IPTVSubscribePageContent() {
  const { planId } = useParams<{ planId: string }>();
  const searchParams = useSearchParams();
  const plan = PLANS[planId as PlanId];

  const { currency, toggleCurrency } = useStoreCurrency();

  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'stripe'>('mpesa');
  const [mpesaState, setMpesaState] = useState<MpesaPhase>({ phase: 'idle' });
  const [stripeState, setStripeState] = useState<StripePhase>({ phase: 'idle' });
  const [activationState, setActivationState] = useState<ActivationState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stripeSessionId = searchParams.get('session_id');
  const stripeCanceled = searchParams.get('canceled');

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);
  useEffect(() => {
    if (!stripeSessionId || activationState) return;

    let cancelled = false;
    setStripeState({ phase: 'verifying' });

    fetch(`/api/stripe/iptv/session?sessionId=${encodeURIComponent(stripeSessionId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error ?? 'Could not verify Stripe subscription.');
        }

        if (cancelled) return;

        setActivationState({
          subscription: data.subscription,
          member: data.member,
          billing: data.billing,
          paymentLabel: 'Stripe',
        });
        setStripeState({ phase: 'idle' });
      })
      .catch((error) => {
        if (cancelled) return;
        setStripeState({
          phase: 'failed',
          reason: error instanceof Error ? error.message : 'Could not verify Stripe subscription.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [activationState, stripeSessionId]);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-xl font-bold">Plan not found.</p>
          <Link href="/iptv"><Button>Back to IPTV Plans</Button></Link>
        </div>
      </div>
    );
  }

  if (stripeSessionId && stripeState.phase === 'verifying' && !activationState) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currency={currency} onCurrencyToggle={toggleCurrency} />
        <div className="container mx-auto px-4 py-24 text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">Verifying your Stripe payment</h1>
          <p className="mt-2 text-gray-500">Preparing your access.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const displayPrice = currency.code === 'USD'
    ? `$${plan.usdPrice.toFixed(2)}`
    : `KSh ${plan.kesPrice.toLocaleString()}`;

  const startPolling = (checkoutRequestId: string) => {
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

          setActivationState({
            subscription: confData.subscription,
            member: confData.member,
            billing: {
              currency: 'KES',
              taxKes: 0,
              chargedKes: confData.subscription.amountKes,
            },
            paymentLabel: 'M-Pesa',
          });
          setMpesaState({ phase: 'idle' });
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
    if (!phone || !customerName || !email) return;

    setMpesaState({ phase: 'sending' });

    try {
      const res = await fetch('/api/iptv/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, customerName, email, phone }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setMpesaState({ phase: 'failed', reason: data.error ?? 'Failed to initiate payment.' });
        return;
      }

      setMpesaState({
        phase: 'waiting',
        checkoutRequestId: data.checkoutRequestId,
        msg: data.customerMessage ?? 'Check your phone for the M-Pesa prompt.',
      });

      startPolling(data.checkoutRequestId);
    } catch {
      setMpesaState({ phase: 'failed', reason: 'Network error. Please check your connection.' });
    }
  };

  const handleStripeSubscribe = async () => {
    if (!phone || !customerName || !email) return;

    setStripeState({ phase: 'redirecting' });

    try {
      const response = await fetch('/api/stripe/iptv/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          customerName,
          email,
          phone,
        }),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        setStripeState({
          phase: 'failed',
          reason: data.error ?? 'Failed to start Stripe subscription checkout.',
        });
        return;
      }

      if (data.kind === 'free' && data.subscription && data.member) {
        setActivationState({
          subscription: data.subscription,
          member: data.member,
          billing: {
            currency: 'KES',
            taxKes: 0,
            chargedKes: data.subscription.amountKes,
          },
          paymentLabel: 'Free Checkout',
        });
        setStripeState({ phase: 'idle' });
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setStripeState({
        phase: 'failed',
        reason: 'Stripe subscription checkout did not return a redirect URL.',
      });
    } catch {
      setStripeState({
        phase: 'failed',
        reason: 'Network error. Please check your connection.',
      });
    }
  };

  const isSuccess = Boolean(activationState);
  const sub = activationState?.subscription ?? null;
  const member = activationState?.member ?? null;
  const billing = activationState?.billing ?? null;

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
                <h1 className="mb-1 text-2xl font-black">Activate your IPTV plan</h1>
                <p className="mb-6 text-sm text-gray-500">Enter your details, pay, and your access appears here.</p>

                {(mpesaState.phase === 'idle' || mpesaState.phase === 'failed') && (
                  <form
                    onSubmit={(event) => {
                      if (paymentMethod === 'mpesa') {
                        void handleSubscribe(event);
                        return;
                      }

                      event.preventDefault();
                      void handleStripeSubscribe();
                    }}
                    className="space-y-5"
                  >
                    {(mpesaState.phase === 'failed' || stripeState.phase === 'failed' || stripeCanceled) && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                        <div>
                          <p className="text-sm font-semibold text-red-800">
                            {stripeCanceled ? 'Stripe checkout canceled' : 'Payment failed'}
                          </p>
                          <p className="mt-0.5 text-xs text-red-700">
                            {mpesaState.phase === 'failed'
                              ? mpesaState.reason
                              : stripeState.phase === 'failed'
                                ? stripeState.reason
                                : 'Stripe checkout was canceled before payment completed.'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="John Kamau"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Email Address *</label>
                        <input
                          type="email"
                          required
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                    </div>

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
                      <p className="mt-1 text-xs text-gray-400">Use this number to sign in later.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'mpesa', label: 'M-Pesa', active: 'border-green-500 bg-green-50 text-green-700', icon: Smartphone },
                        { id: 'stripe', label: 'Stripe / Cards', active: 'border-violet-500 bg-violet-50 text-violet-700', icon: CreditCard },
                      ].map(({ id, label, active, icon: Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(id as 'mpesa' | 'stripe');
                            setMpesaState({ phase: 'idle' });
                            setStripeState({ phase: 'idle' });
                          }}
                          className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left ${paymentMethod === id ? active : 'border-gray-200 text-gray-700'}`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-sm font-semibold">{label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                      <p className="mb-1 font-semibold">Next</p>
                      <ul className="space-y-1 text-xs">
                        {paymentMethod === 'mpesa' ? (
                          <>
                            <li>Tap pay below.</li>
                            <li>Approve on your phone.</li>
                            <li>Your access appears here.</li>
                          </>
                        ) : (
                          <>
                            <li>Continue to Stripe.</li>
                            <li>Complete payment.</li>
                            <li>Your access appears here.</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {paymentMethod === 'stripe' && (
                      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
                        Tax is shown at checkout.
                      </div>
                    )}

                    {paymentMethod === 'mpesa' ? (
                      <Button
                        type="submit"
                        className="w-full rounded-xl bg-violet-600 py-6 text-base font-bold hover:bg-violet-700"
                      >
                        <Smartphone className="mr-2 h-5 w-5" />
                        Pay {displayPrice} with M-Pesa
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={stripeState.phase === 'redirecting' || stripeState.phase === 'verifying'}
                        className="w-full rounded-xl bg-slate-900 py-6 text-base font-bold hover:bg-slate-800"
                      >
                        {stripeState.phase === 'redirecting' || stripeState.phase === 'verifying' ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Preparing Stripe Checkout
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-5 w-5" />
                            Continue with Stripe
                          </>
                        )}
                      </Button>
                    )}

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                      <Shield className="h-3.5 w-3.5" /> Secure payment via {paymentMethod === 'mpesa' ? 'Safaricom Daraja' : 'Stripe Checkout'}
                    </div>
                  </form>
                )}

                {mpesaState.phase === 'sending' && (
                  <div className="py-12 text-center">
                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-violet-600" />
                    <p className="font-semibold text-gray-800">Sending prompt...</p>
                    <p className="mt-1 text-sm text-gray-500">Please wait a moment.</p>
                  </div>
                )}

                {mpesaState.phase === 'waiting' && (
                  <div className="space-y-5 py-6 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                      <Smartphone className="h-10 w-10 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900">Check your phone</p>
                      <p className="mt-1 text-sm text-gray-500">{mpesaState.msg}</p>
                    </div>
                    <div className="mx-auto max-w-xs rounded-xl border border-green-200 bg-green-50 p-4 text-left text-sm text-green-800">
                      <p className="font-semibold">Approve payment</p>
                      <p className="mt-1 text-2xl font-black text-green-700">{displayPrice}</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Waiting for payment...
                    </div>
                    <button
                      type="button"
                      onClick={() => setMpesaState({ phase: 'idle' })}
                      className="text-xs text-gray-400 underline hover:text-red-500"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {mpesaState.phase === 'confirming' && (
                  <div className="py-12 text-center">
                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-violet-600" />
                    <p className="font-semibold text-gray-800">Payment confirmed. Preparing access.</p>
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
                    'M-Pesa or card checkout',
                    'Protected playlist',
                    'Phone + code sign-in',
                    'Live TV, movies, and sports',
                    'Setup help',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="rounded-xl border border-violet-600/40 bg-violet-800/40 p-3 text-xs text-violet-200">
                  <Tv className="mb-1 h-4 w-4 text-violet-300" />
                  Your access appears here after payment.
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
                <h1 className="text-3xl font-black text-gray-900">Access ready</h1>
                <p className="mt-2 text-gray-500">
                  Save these details before leaving.
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
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-semibold">{activationState!.paymentLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Charged Today</span>
                  <span className="font-bold text-emerald-600">
                    KSh {(billing?.chargedKes ?? sub!.amountKes).toLocaleString()}
                  </span>
                </div>
                {sub!.mpesaReceipt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">M-Pesa Receipt</span>
                    <span className="font-mono font-bold text-emerald-700">{sub!.mpesaReceipt}</span>
                  </div>
                )}
                {(billing?.taxKes ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax / VAT</span>
                    <span className="font-semibold">KSh {billing!.taxKes.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Expires</span>
                  <span className="font-semibold">{new Date(sub!.expiresAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="mb-3 text-lg font-bold">Sign-in details</h2>
                <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4">
                  {[
                    { label: 'Phone Number', value: member!.profileId },
                    { label: 'Access Code', value: member!.accessCode },
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
                  You are signed in on this device.
                </p>
              </div>

              {/* Credentials */}
              {sub!.credentials && (
                <div className="mb-6">
                  <h2 className="mb-3 text-lg font-bold">Playlist details</h2>
                  <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50 p-4">
                    {[
                      { label: 'Playlist Link', value: sub!.credentials.m3uUrl },
                      { label: 'Portal / Host', value: sub!.credentials.xtreamHost },
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
                    Save these details now. Contact support with your phone or reference if needed.
                  </p>
                </div>
              )}

              {/* Setup instructions */}
              <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <p className="mb-2 font-semibold">Quick setup</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Install <strong>IPTV Smarters Pro</strong>, <strong>TiviMate</strong>, <strong>VLC</strong>, or any compatible player</li>
                  <li>Paste the playlist link</li>
                  <li>Or use the host, username, and password above</li>
                  <li>Use the member hub anytime from the login page</li>
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
                    Open My Hub
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

function IPTVSubscribePageFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-24 text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">Loading checkout</h1>
        <p className="mt-2 text-gray-500">Preparing your plan.</p>
      </div>
    </div>
  );
}

export default function IPTVSubscribePage() {
  return (
    <Suspense fallback={<IPTVSubscribePageFallback />}>
      <IPTVSubscribePageContent />
    </Suspense>
  );
}
