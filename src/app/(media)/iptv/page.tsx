'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useStoreCurrency, type StoreCurrency } from '@/domains/storefront/hooks/useStoreCurrency';
import {
  Check,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  PlayCircle,
  Radio,
  ShieldCheck,
  Smartphone,
  Tv2,
  Waves,
} from 'lucide-react';
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
      'M-Pesa activation',
      'Protected playlist + Xtream login',
      'Smart TV and box setup help',
      'Browser member hub included',
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
      'M-Pesa activation',
      'Smart TV, Firestick, and Kodi ready',
      'Playlist + Xtream credentials',
      'Priority support',
      'Browser member hub included',
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
      'M-Pesa activation',
      'Protected playlist + Xtream login',
      'Browser member hub included',
      'Long-term support',
    ],
  },
];

function getPrice(plan: Plan, currency: StoreCurrency) {
  return currency.code === 'USD'
    ? `$${plan.usdPrice.toFixed(2)}`
    : `KSh ${plan.kesPrice.toLocaleString()}`;
}

function getMonthlyPrice(plan: Plan, currency: StoreCurrency) {
  return currency.code === 'USD'
    ? `$${(plan.usdPrice / plan.months).toFixed(2)}/mo`
    : `KSh ${Math.round(plan.kesPrice / plan.months).toLocaleString()}/mo`;
}

export default function IPTVPage() {
  const { currency, toggleCurrency } = useStoreCurrency();

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      <section className="relative overflow-hidden bg-[#040814] py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_24%),linear-gradient(180deg,#040814_0%,#08111f_55%,#040814_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />

        <div className="relative container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/80">
                  <Tv2 className="h-3.5 w-3.5" />
                  GameStop IPTV
                </div>
                <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                  Set up on Smart TV, Android Box, Firestick, Kodi, TiviMate, and IPTV Smarters.
                </h1>
                <p className="mt-5 max-w-2xl text-lg text-white/[0.66]">
                  Checkout gives you a protected playlist URL plus Xtream host, username, and password. Your browser member hub still comes with the plan.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Button
                    asChild
                    data-tv-autofocus="true"
                    className="rounded-2xl bg-white px-8 py-6 text-base font-bold text-slate-950 hover:bg-slate-100"
                  >
                    <a href="#plans">See Plans</a>
                  </Button>
                  <a
                    href="https://wa.me/254115278516?text=Hi!%20I%20need%20help%20choosing%20a%20GameStop%20IPTV%20plan."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-transparent px-8 py-6 text-base font-bold text-white hover:bg-white/10"
                    >
                      WhatsApp Help
                    </Button>
                  </a>
                  <Link href="/movies/login">
                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-transparent px-8 py-6 text-base font-bold text-white hover:bg-white/10"
                    >
                      Member Sign In
                    </Button>
                  </Link>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Radio, title: 'Live TV', text: 'Always-on channels.' },
                    { icon: PlayCircle, title: 'VOD', text: 'Movies and series.' },
                    { icon: Waves, title: 'Sports', text: 'Live event slots.' },
                  ].map(({ icon: Icon, title, text }) => (
                    <div
                      key={title}
                      className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.08] text-white/80">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-4 font-semibold text-white">{title}</p>
                      <p className="mt-1 text-sm text-white/[0.62]">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-100/80">How it works</p>
                <div className="mt-5 space-y-4">
                  {[
                    {
                      icon: CreditCard,
                      title: '1. Choose a plan',
                      text: 'Pick a plan.',
                    },
                    {
                      icon: Smartphone,
                      title: '2. Approve M-Pesa',
                      text: 'Confirm on your phone.',
                    },
                    {
                      icon: LockKeyhole,
                      title: '3. Save TV setup details',
                      text: 'Copy the playlist, portal host, username, and password.',
                    },
                    {
                      icon: CheckCircle2,
                      title: '4. Start watching anywhere',
                      text: 'Use TiviMate, IPTV Smarters, Kodi, VLC, or open the browser hub.',
                    },
                  ].map(({ icon: Icon, title, text }) => (
                    <div
                      key={title}
                      className="rounded-[24px] border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] text-white/80">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{title}</p>
                          <p className="mt-1 text-sm text-white/[0.62]">{text}</p>
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
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: 'Protected playlist access',
                text: 'Every active subscription gets a secure playlist link plus Xtream credentials.',
              },
              {
                icon: Tv2,
                title: 'External players first',
                text: 'Best on TiviMate, IPTV Smarters, Kodi, VLC, smart TVs, and streaming sticks.',
              },
              {
                icon: Waves,
                title: 'Browser hub included',
                text: 'Members can still open live TV, movies, and support playback in the browser.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="bg-[#050b18] py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black">Choose a plan</h2>
            <p className="mt-2 text-white/[0.58]">
              Activate once, save your TV setup details, and keep browser access as a backup.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                data-tv-card
                className={`rounded-[30px] border p-6 ${
                  plan.popular
                    ? 'border-amber-300/40 bg-[linear-gradient(180deg,rgba(251,191,36,0.14),rgba(255,255,255,0.04))]'
                    : 'border-white/10 bg-white/[0.05]'
                }`}
              >
                <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                  {plan.badge}
                </p>
                <h3 className="mt-4 text-2xl font-black">{plan.name}</h3>
                <p className="mt-3 text-4xl font-black">{getPrice(plan, currency)}</p>
                <p className="mt-1 text-sm text-white/[0.62]">{getMonthlyPrice(plan, currency)}</p>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-white/[0.8]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={`/iptv/subscribe/${plan.id}`} className="mt-6 block">
                  <Button
                    className={`w-full rounded-2xl py-5 font-bold ${
                      plan.popular
                        ? 'bg-white text-slate-950 hover:bg-slate-100'
                        : 'bg-sky-300 text-slate-950 hover:bg-sky-200'
                    }`}
                  >
                    Choose Plan
                  </Button>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
