'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Check,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Tv,
  UserCog,
  Wallet,
} from 'lucide-react';

type Currency = { code: 'KES' | 'USD'; symbol: string };
type Plan = {
  id: string;
  name: string;
  months: number;
  usdPrice: number;
  kesPrice: number;
  badge: string;
  popular?: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    id: '3mo',
    name: '3 Months',
    months: 3,
    usdPrice: 29.99,
    kesPrice: 4499,
    badge: 'Starter',
    features: [
      'M-Pesa payment dashboard',
      'Instant credential delivery after activation',
      '1 stream at a time',
      'WhatsApp setup support',
    ],
  },
  {
    id: '12mo',
    name: '12 Months',
    months: 12,
    usdPrice: 99.99,
    kesPrice: 14999,
    badge: 'Best Value',
    popular: true,
    features: [
      'M-Pesa payment dashboard',
      'Instant credential delivery after activation',
      'Priority support queue',
      'Renewal handled by admin team',
    ],
  },
  {
    id: '24mo',
    name: '24 Months',
    months: 24,
    usdPrice: 149.99,
    kesPrice: 22499,
    badge: 'Long-Term',
    features: [
      'M-Pesa payment dashboard',
      'Instant credential delivery after activation',
      'VIP support queue',
      'Admin-managed renewals',
    ],
  },
];

function getPrice(plan: Plan, currency: Currency) {
  return currency.code === 'USD' ? `$${plan.usdPrice.toFixed(2)}` : `KSh ${plan.kesPrice.toLocaleString()}`;
}

function getMonthlyPrice(plan: Plan, currency: Currency) {
  return currency.code === 'USD'
    ? `$${(plan.usdPrice / plan.months).toFixed(2)}/mo`
    : `KSh ${Math.round(plan.kesPrice / plan.months).toLocaleString()}/mo`;
}

export default function IPTVPage() {
  const [currency, setCurrency] = useState<Currency>({ code: 'KES', symbol: 'KSh' });

  const toggleCurrency = () => {
    setCurrency((prev) =>
      prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      <section className="bg-gradient-to-br from-gray-950 via-violet-950 to-gray-950 py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-10 md:grid-cols-[1.2fr,0.8fr] md:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-200">
                  <Wallet className="h-3.5 w-3.5" />
                  Customer Payment Dashboard
                </div>
                <h1 className="text-4xl font-black leading-tight md:text-6xl">
                  Pay, Confirm, and Receive Your Login Codes
                </h1>
                <p className="mt-5 max-w-2xl text-lg text-gray-300">
                  Customers only need one flow: choose a plan, approve the M-Pesa payment request, and receive the movie access code plus Xtream and M3U login details after activation. Subscription management stays with the admin team.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button asChild className="rounded-xl bg-violet-600 px-8 py-6 text-lg font-bold hover:bg-violet-700">
                    <a href="#plans">Open Payment Plans</a>
                  </Button>
                  <Link href="/movies/login">
                    <Button
                      variant="outline"
                      className="rounded-xl border-white/25 bg-transparent px-8 py-6 text-lg font-bold text-white hover:bg-white/10"
                    >
                      Member Login
                    </Button>
                  </Link>
                  <a
                    href="https://wa.me/254717402034?text=Hi!%20I%20need%20help%20with%20the%20IPTV%20payment%20dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="rounded-xl border-white/25 bg-transparent px-8 py-6 text-lg font-bold text-white hover:bg-white/10"
                    >
                      Payment Support
                    </Button>
                  </a>
                </div>
              </div>

              <div className="rounded-3xl border border-violet-500/30 bg-violet-900/50 p-6 backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-violet-200">
                  Fulfillment Flow
                </p>
                <div className="mt-4 space-y-4">
                  {[
                    { icon: CreditCard, title: '1. Select a plan', text: 'The customer opens one payment page and picks a subscription term.' },
                    { icon: Smartphone, title: '2. Approve M-Pesa', text: 'The STK push is sent to the customer phone and payment is confirmed.' },
                    { icon: CheckCircle2, title: '3. Create user automatically', text: 'The normalized M-Pesa number becomes the profile ID and an access code is generated.' },
                    { icon: UserCog, title: '4. Open the movie library', text: 'The customer is signed in automatically while admins still manage renewals and support.' },
                  ].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-100">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{title}</p>
                          <p className="mt-1 text-sm text-violet-100/80">{text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: 'Admin-managed subscriptions',
                text: 'Renewals, manual activations, and status corrections happen from the internal admin dashboard.',
              },
              {
                icon: Tv,
                title: 'Codes delivered after payment',
                text: 'Customers receive the movie access code, Xtream credentials, and M3U details immediately after activation.',
              },
              {
                icon: Smartphone,
                title: 'M-Pesa first',
                text: 'The customer flow is centered on STK push so checkout stays simple on mobile.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <p className="mt-2 text-sm text-gray-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="bg-gray-950 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">Choose a Payment Plan</h2>
            <p className="mt-2 text-gray-400">
              Payment activates the subscription, creates the member profile, and opens the logged-in movie flow.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`rounded-2xl border p-6 ${
                  plan.popular
                    ? 'border-violet-400 bg-violet-700 ring-2 ring-violet-400'
                    : 'border-gray-800 bg-gray-900'
                }`}
              >
                <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-violet-100">
                  {plan.badge}
                </p>
                <h3 className="mt-4 text-2xl font-black">{plan.name}</h3>
                <p className="mt-3 text-4xl font-black">{getPrice(plan, currency)}</p>
                <p className="mt-1 text-sm text-violet-200">{getMonthlyPrice(plan, currency)}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-200">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`/iptv/subscribe/${plan.id}`} className="mt-6 block">
                  <Button
                    className={`w-full rounded-xl py-5 font-bold ${
                      plan.popular
                        ? 'bg-white text-violet-800 hover:bg-gray-100'
                        : 'bg-violet-600 text-white hover:bg-violet-700'
                    }`}
                  >
                    Open Payment Dashboard
                  </Button>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="rounded-3xl border border-violet-100 bg-violet-50 p-8">
            <h2 className="text-2xl font-black text-gray-900">How this works</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-5">
                <p className="text-sm font-semibold text-violet-700">Customer side</p>
                <p className="mt-2 text-sm text-gray-600">
                  Select a plan, complete the M-Pesa payment, save the generated codes, and continue directly into the movie library.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5">
                <p className="text-sm font-semibold text-violet-700">Admin side</p>
                <p className="mt-2 text-sm text-gray-600">
                  Manage pending or active subscriptions, handle exceptions, and re-issue support from the internal dashboard.
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm text-violet-800">
              Returning users sign in with M-Pesa number plus access code. If they lose the code after payment, the recovery path should still be handled by the admin team.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
