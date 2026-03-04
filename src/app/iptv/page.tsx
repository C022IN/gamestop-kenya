'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Tv,
  Wifi,
  Globe,
  ShieldCheck,
  Star,
  Check,
  Smartphone,
  Monitor,
  Tablet,
  Zap,
  HeadphonesIcon,
  Trophy,
  DollarSign,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

type Currency = { code: 'KES' | 'USD'; symbol: string };
type Plan = {
  id: string;
  name: string;
  months: number;
  usdPrice: number;
  usdOriginal: number;
  kesPrice: number;
  kesOriginal: number;
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
    usdOriginal: 89.97,
    kesPrice: 4499,
    kesOriginal: 13496,
    badge: 'Save 67%',
    features: [
      '20,000+ live channels',
      'PPV events included',
      '100,000+ movies and series',
      'EPG + catch-up on compatible apps',
      'One stream at a time',
    ],
  },
  {
    id: '12mo',
    name: '12 Months',
    months: 12,
    usdPrice: 99.99,
    usdOriginal: 399.88,
    kesPrice: 14999,
    kesOriginal: 59982,
    badge: 'Best Value - Save 75%',
    popular: true,
    features: [
      '20,000+ live channels',
      'PPV events included',
      '100,000+ movies and series',
      'EPG + catch-up on compatible apps',
      'Priority support',
    ],
  },
  {
    id: '24mo',
    name: '24 Months',
    months: 24,
    usdPrice: 149.99,
    usdOriginal: 799.76,
    kesPrice: 22499,
    kesOriginal: 119964,
    badge: 'Max Savings - Save 80%',
    features: [
      '20,000+ live channels',
      'PPV events included',
      '100,000+ movies and series',
      'EPG + catch-up on compatible apps',
      'VIP support queue',
    ],
  },
];

const faqs = [
  {
    q: 'How does setup work after payment?',
    a: 'Credentials are delivered by WhatsApp/email with device-specific setup steps. Most setups take under 10 minutes.',
  },
  {
    q: 'Can I pay with M-Pesa?',
    a: 'Yes. M-Pesa is supported alongside Visa, Mastercard, and Airtel Money.',
  },
  {
    q: 'Can I request a trial first?',
    a: 'Yes. You can request a 24-hour trial through PPV Arena before choosing a full plan.',
  },
  {
    q: 'Is there a Kodi workflow for large VOD libraries?',
    a: 'Yes. Advanced users can use Xtream API workflows with cached sync and metadata indexing for better library performance.',
  },
];

const devices = [
  { icon: Tv, name: 'Smart TV' },
  { icon: Tv, name: 'Apple TV' },
  { icon: Tv, name: 'Firestick' },
  { icon: Tv, name: 'Roku' },
  { icon: Smartphone, name: 'Android' },
  { icon: Smartphone, name: 'iPhone / iPad' },
  { icon: Monitor, name: 'Web Browser' },
  { icon: Tablet, name: 'Android Box' },
];

const FLASH_SALE_DURATION_MS = (6 * 3600 + 18 * 60 + 32) * 1000;

function FlashCountdown() {
  const [time, setTime] = useState({ h: 6, m: 18, s: 32 });

  useEffect(() => {
    const end = Date.now() + FLASH_SALE_DURATION_MS;
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-2 font-mono text-white">
      {[time.h, time.m, time.s].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="min-w-[3rem] rounded-lg bg-red-700 px-3 py-2 text-center text-2xl font-black">{pad(v)}</span>
          {i < 2 && <span className="text-xl font-bold text-red-300">:</span>}
        </span>
      ))}
    </div>
  );
}

function getPrice(plan: Plan, currency: Currency): string {
  return currency.code === 'USD'
    ? `$${plan.usdPrice.toFixed(2)}`
    : `KSh ${plan.kesPrice.toLocaleString()}`;
}

function getOriginalPrice(plan: Plan, currency: Currency): string {
  return currency.code === 'USD'
    ? `$${plan.usdOriginal.toFixed(2)}`
    : `KSh ${plan.kesOriginal.toLocaleString()}`;
}

function getMonthlyPrice(plan: Plan, currency: Currency): string {
  if (currency.code === 'USD') return `$${(plan.usdPrice / plan.months).toFixed(2)}/mo`;
  return `KSh ${Math.round(plan.kesPrice / plan.months).toLocaleString()}/mo`;
}

export default function IPTVPage() {
  const [currency, setCurrency] = useState<Currency>({ code: 'KES', symbol: 'KSh' });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleCurrency = () =>
    setCurrency((prev) =>
      prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' }
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-violet-950 to-gray-950 py-20 text-white">
        <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-500/25 px-3 py-1.5 text-xs font-semibold text-violet-200">
                <Tv className="h-3.5 w-3.5" />
                Premium IPTV by PPV Arena
              </div>
              <h1 className="mb-4 text-4xl font-black leading-tight md:text-6xl">
                One Subscription for Sports, TV, and Movies
              </h1>
              <p className="mb-6 max-w-xl text-lg text-gray-300">
                Consolidate streaming costs into one package with sports, movies, live TV, and local support.
              </p>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <span className="text-sm text-gray-300">Rated 4.8/5 by 53,000+ customers</span>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button asChild className="rounded-xl bg-violet-600 px-8 py-6 text-lg font-bold hover:bg-violet-700">
                  <a href="#plans">View Plans</a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-white/35 bg-transparent px-8 py-6 text-lg font-bold text-white hover:bg-white/10"
                >
                  <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
                    Request 24h Trial
                  </a>
                </Button>
              </div>
            </div>

            <div className="lux-card rounded-3xl border border-violet-500/30 bg-violet-900/35 p-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-200">Limited Offer Window</p>
              <p className="mb-4 text-3xl font-black">Save up to 80% on long-term plans</p>
              <p className="mb-5 text-sm text-violet-200">Pricing updates after the current promotion period.</p>
              <p className="mb-2 text-sm text-violet-200">Offer ends in:</p>
              <FlashCountdown />
              <div className="mt-5 space-y-2 text-sm text-violet-100">
                {[
                  'M-Pesa, Visa, Mastercard, and Airtel Money accepted',
                  'Instant account delivery after confirmation',
                  'Setup support by WhatsApp',
                ].map((line) => (
                  <div key={line} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-violet-700 py-8 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            {[
              { value: '20,000+', label: 'Live Channels' },
              { value: '100K+', label: 'Movies and Shows' },
              { value: '198', label: 'Countries' },
              { value: '4.8/5', label: 'Average Rating' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/10 p-3">
                <div className="text-3xl font-extrabold">{stat.value}</div>
                <div className="mt-1 text-sm text-violet-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h2 className="mb-3 text-3xl font-bold">Core Features</h2>
          <p className="text-gray-500">Feature set inspired by leading IPTV storefronts and Kodi/Xtream workflows.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: Trophy, title: 'Sports + PPV', text: 'Major leagues and PPV events in one package.' },
            { icon: Globe, title: 'Global Channels', text: 'International and local channel categories.' },
            { icon: Zap, title: 'EPG + Catch-up', text: 'TV guide and replay support on compatible apps.' },
            { icon: HeadphonesIcon, title: 'Support', text: 'WhatsApp setup support when you need it.' },
            { icon: ShieldCheck, title: 'Secure Payments', text: 'M-Pesa, cards, and Airtel Money supported.' },
            { icon: Tv, title: 'Kodi Ready', text: 'Xtream-style workflows for organized VOD libraries.' },
          ].map((item) => (
            <article key={item.title} className="lux-card rounded-2xl p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="plans" className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold">Choose Your Plan</h2>
            <p className="text-gray-400">All plans include setup support and full catalog access.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`lux-card rounded-2xl border p-6 ${
                  plan.popular ? 'border-violet-300 bg-violet-700 ring-2 ring-violet-300' : 'border-gray-700 bg-gray-800/80'
                }`}
              >
                <p className={`mb-2 inline-block rounded px-2 py-1 text-xs font-bold ${plan.popular ? 'bg-amber-300/25 text-amber-200' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {plan.badge}
                </p>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-gray-300 line-through">{getOriginalPrice(plan, currency)}</p>
                <p className="text-3xl font-extrabold">{getPrice(plan, currency)}</p>
                <p className="mb-4 text-sm text-violet-200">{getMonthlyPrice(plan, currency)}</p>
                <ul className="mb-5 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`w-full rounded-xl py-5 font-bold ${plan.popular ? 'bg-white text-violet-800 hover:bg-gray-100' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                >
                  <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
                    Subscribe Now
                  </a>
                </Button>
              </article>
            ))}
          </div>
          <div className="mt-8 space-y-2 text-center text-sm text-gray-300">
            <p className="flex items-center justify-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-400" /> 7-day money-back window
            </p>
            <p>Payments supported: M-Pesa, Visa, Mastercard, Airtel Money.</p>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-14">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold">Supported Devices</h2>
            <p className="text-gray-500">Works across TV, mobile, and desktop apps.</p>
          </div>
          <div className="mx-auto grid max-w-3xl grid-cols-4 gap-4 md:grid-cols-8">
            {devices.map((device) => (
              <div key={device.name} className="lux-card flex flex-col items-center gap-2 rounded-2xl p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <device.icon className="h-6 w-6" />
                </div>
                <span className="text-center text-[11px] font-medium leading-tight text-gray-600">{device.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-violet-800 to-violet-950 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <Wifi className="mx-auto mb-4 h-12 w-12 text-violet-200" />
          <h2 className="mb-3 text-3xl font-bold">Try Before You Commit</h2>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-violet-200">
            Request a free 24-hour trial to evaluate stream quality and channel coverage.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild className="rounded-xl bg-white px-10 py-6 text-lg font-bold text-violet-800 hover:bg-gray-100">
              <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">Start Trial</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-white/40 bg-transparent px-10 py-6 text-lg font-bold text-white hover:bg-white/15"
            >
              <a href="https://wa.me/254700123456?text=Hi!%20I%20want%20to%20subscribe%20to%20IPTV" target="_blank" rel="noopener noreferrer">
                Order on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-10 text-center text-3xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="lux-card overflow-hidden rounded-xl">
              <button
                type="button"
                className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-violet-600 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="border-t border-gray-200 px-6 pb-5 pt-4 text-sm leading-relaxed text-gray-600">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="bg-gray-900 py-5 text-center text-xs text-gray-400">
        <p className="container mx-auto px-4">
          IPTV service is provided by{' '}
          <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
            PPV Arena
          </a>
          , distributed through GameStop Kenya. Need help? WhatsApp +254 700 123 456.
        </p>
      </div>

      <Footer />
    </div>
  );
}
