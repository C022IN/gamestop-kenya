'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
  X,
  Loader2,
  Send,
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
  badgeColor: 'emerald' | 'amber' | 'cyan';
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
    badgeColor: 'emerald',
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
    badge: 'Best Value – Save 75%',
    badgeColor: 'amber',
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
    badge: 'Max Savings – Save 80%',
    badgeColor: 'cyan',
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
    a: 'After payment, your Xtream Codes credentials and M3U playlist URL are delivered instantly on-screen and retrievable from My Subscription. Setup takes under 10 minutes on any device.',
  },
  {
    q: 'Can I pay with M-Pesa?',
    a: 'Yes. M-Pesa STK push is the primary payment method — a pop-up appears on your phone, enter your PIN, and your subscription activates immediately.',
  },
  {
    q: 'Can I request a free trial first?',
    a: 'Yes. Use the "Request 24h Trial" button to send a request via WhatsApp. Our team will activate a trial account for you within minutes during business hours.',
  },
  {
    q: 'What apps support these credentials?',
    a: 'IPTV Smarters Pro, TiviMate, GSE Smart IPTV, VLC, Kodi (with PVR IPTV Simple Client), and any Xtream Codes or M3U-compatible player on Smart TV, Android, iOS, Firestick, or browser.',
  },
  {
    q: 'Is there a Kodi workflow for large VOD libraries?',
    a: 'Yes. Advanced users can use Xtream API workflows with cached sync and metadata indexing for better library performance.',
  },
  {
    q: 'How do I retrieve my credentials later?',
    a: 'Visit the "My Subscription" page and enter the email or phone number you used when subscribing.',
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
      setTime({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
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

function getPrice(plan: Plan, currency: Currency) {
  return currency.code === 'USD' ? `$${plan.usdPrice.toFixed(2)}` : `KSh ${plan.kesPrice.toLocaleString()}`;
}
function getOriginalPrice(plan: Plan, currency: Currency) {
  return currency.code === 'USD' ? `$${plan.usdOriginal.toFixed(2)}` : `KSh ${plan.kesOriginal.toLocaleString()}`;
}
function getMonthlyPrice(plan: Plan, currency: Currency) {
  return currency.code === 'USD'
    ? `$${(plan.usdPrice / plan.months).toFixed(2)}/mo`
    : `KSh ${Math.round(plan.kesPrice / plan.months).toLocaleString()}/mo`;
}

/* ─── Trial Request Modal ─── */
type TrialPhase = 'form' | 'sending' | 'sent';

function TrialModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phase, setPhase] = useState<TrialPhase>('form');
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setPhase('sending');
    // Open WhatsApp with pre-filled message
    const msg = `Hi GameStop Kenya! I'd like to request a free 24-hour IPTV trial.\n\nName: ${name}\nPhone: ${phone}\n\nPlease activate a trial for me. Thanks!`;
    setTimeout(() => {
      window.open(`https://wa.me/254700123456?text=${encodeURIComponent(msg)}`, '_blank');
      setPhase('sent');
    }, 800);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          title="Close"
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Tv className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black">Request Free 24h Trial</h2>
            <p className="text-sm text-gray-500">Test before you subscribe.</p>
          </div>
        </div>

        {phase === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Your Name *</label>
              <input
                type="text"
                required
                placeholder="John Kamau"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">WhatsApp / Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="0712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-xs text-violet-700">
              Your request will be sent to our team via WhatsApp. Trial accounts are typically activated within minutes during business hours (8AM–8PM EAT).
            </div>
            <Button type="submit" className="w-full rounded-xl bg-violet-600 py-5 font-bold hover:bg-violet-700">
              <Send className="mr-2 h-4 w-4" />
              Send Trial Request via WhatsApp
            </Button>
          </form>
        )}

        {phase === 'sending' && (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-violet-600" />
            <p className="font-semibold text-gray-700">Opening WhatsApp…</p>
          </div>
        )}

        {phase === 'sent' && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900">Request Sent!</h3>
            <p className="mt-1 text-sm text-gray-500">
              WhatsApp has been opened with your request. Our team will activate your trial shortly.
            </p>
            <Button onClick={onClose} className="mt-5 w-full rounded-xl bg-violet-600 hover:bg-violet-700">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IPTVPage() {
  const [currency, setCurrency] = useState<Currency>({ code: 'KES', symbol: 'KSh' });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [trialOpen, setTrialOpen] = useState(false);

  const toggleCurrency = () =>
    setCurrency((prev) =>
      prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' }
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      {trialOpen && <TrialModal onClose={() => setTrialOpen(false)} />}

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-violet-950 to-gray-950 py-20 text-white">
        <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-500/25 px-3 py-1.5 text-xs font-semibold text-violet-200">
                <Tv className="h-3.5 w-3.5" />
                Premium IPTV by GameStop Kenya
              </div>
              <h1 className="mb-4 text-4xl font-black leading-tight md:text-6xl">
                One Subscription for Sports, TV, and Movies
              </h1>
              <p className="mb-6 max-w-xl text-lg text-gray-300">
                Consolidate multiple streaming subscriptions into one service with broad live sports coverage, on-demand content, and local support through GameStop Kenya.
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
                  type="button"
                  variant="outline"
                  onClick={() => setTrialOpen(true)}
                  className="rounded-xl border-white/35 bg-transparent px-8 py-6 text-lg font-bold text-white hover:bg-white/10"
                >
                  Request 24h Trial
                </Button>
              </div>
            </div>

            {/* Hero card — fixed: explicit dark bg, no lux-card */}
            <div className="rounded-3xl border border-violet-500/30 bg-violet-900/60 p-6 backdrop-blur-sm">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-200">Limited Offer Window</p>
              <p className="mb-4 text-3xl font-black text-white">Save up to 80% on long-term plans</p>
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

      {/* ─── Stats bar ─── */}
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

      {/* ─── Features ─── */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h2 className="mb-3 text-3xl font-bold">Core Features</h2>
          <p className="text-gray-500">Everything you need in one subscription — no multiple apps, no juggling passwords.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: Trophy, title: 'Sports + PPV', text: 'Major leagues, cup finals, and PPV events in one package.' },
            { icon: Globe, title: 'Global Channels', text: 'International and local channel categories from 198 countries.' },
            { icon: Zap, title: 'EPG + Catch-up', text: 'TV guide and replay support on compatible apps like TiviMate.' },
            { icon: HeadphonesIcon, title: 'Local Support', text: 'WhatsApp setup support from our team — 8AM to 8PM EAT.' },
            { icon: ShieldCheck, title: 'Secure Payments', text: 'M-Pesa STK push, Visa, Mastercard, and Airtel Money.' },
            { icon: Tv, title: 'Kodi Ready', text: 'Xtream-style credentials work with Kodi, VLC, and all major IPTV apps.' },
          ].map((item) => (
            <article key={item.title} className="lux-card rounded-2xl p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Plans ─── */}
      <section id="plans" className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold">Choose Your Plan</h2>
            <p className="text-gray-400">All plans include setup support and full catalog access. Instant activation after payment.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {plans.map((plan) => {
              const badgeCls =
                plan.badgeColor === 'amber'
                  ? 'bg-amber-400/20 text-amber-300'
                  : plan.badgeColor === 'cyan'
                  ? 'bg-cyan-400/15 text-cyan-300'
                  : 'bg-emerald-400/15 text-emerald-300';

              const cardCls = plan.popular
                ? 'border-violet-400 bg-violet-700 ring-2 ring-violet-400'
                : 'border-gray-700 bg-gray-800';

              return (
                <article
                  key={plan.id}
                  className={`rounded-2xl border p-6 transition-transform hover:-translate-y-1 shadow-plan-dark ${cardCls}`}
                >
                  <p className={`mb-2 inline-block rounded px-2 py-1 text-xs font-bold ${badgeCls}`}>
                    {plan.badge}
                  </p>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-400 line-through">{getOriginalPrice(plan, currency)}</p>
                  <p className="text-3xl font-extrabold text-white">{getPrice(plan, currency)}</p>
                  <p className="mb-5 text-sm text-violet-300">{getMonthlyPrice(plan, currency)}</p>
                  <ul className="mb-6 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-200">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/iptv/subscribe/${plan.id}`} className="block">
                    <Button
                      className={`w-full rounded-xl py-5 font-bold ${
                        plan.popular
                          ? 'bg-white text-violet-800 hover:bg-gray-100'
                          : 'bg-violet-600 text-white hover:bg-violet-700'
                      }`}
                    >
                      Subscribe Now
                    </Button>
                  </Link>
                </article>
              );
            })}
          </div>
          <div className="mt-8 space-y-2 text-center text-sm text-gray-400">
            <p className="flex items-center justify-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-400" /> 7-day money-back guarantee
            </p>
            <p>Payments: M-Pesa, Visa, Mastercard, Airtel Money.</p>
          </div>
        </div>
      </section>

      {/* ─── Supported Devices ─── */}
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

      {/* ─── Trial CTA ─── */}
      <section className="bg-gradient-to-br from-violet-800 to-violet-950 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <Wifi className="mx-auto mb-4 h-12 w-12 text-violet-200" />
          <h2 className="mb-3 text-3xl font-bold">Try Before You Commit</h2>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-violet-200">
            Request a free 24-hour trial to evaluate stream quality and channel coverage before subscribing.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              type="button"
              onClick={() => setTrialOpen(true)}
              className="rounded-xl bg-white px-10 py-6 text-lg font-bold text-violet-800 hover:bg-gray-100"
            >
              Start Free Trial
            </Button>
            <a
              href="https://wa.me/254700123456?text=Hi!%20I%20want%20to%20subscribe%20to%20GameStop%20Kenya%20IPTV"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="rounded-xl border-white/40 bg-transparent px-10 py-6 text-lg font-bold text-white hover:bg-white/15"
              >
                Order on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── My Subscription link ─── */}
      <section className="bg-gray-900 py-8 text-white">
        <div className="container mx-auto px-4 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between">
          <p className="text-sm text-gray-300">Already subscribed? View your credentials and subscription details.</p>
          <Link href="/iptv/my-subscription">
            <Button variant="outline" className="rounded-xl border-violet-400 text-violet-300 hover:bg-violet-900/50">
              My Subscription →
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="container mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-10 text-center text-3xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="lux-card overflow-hidden rounded-xl">
              <button
                type="button"
                className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-gray-900"
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

      {/* ─── Footer note ─── */}
      <div className="bg-gray-900 py-5 text-center text-xs text-gray-400">
        <p className="container mx-auto px-4">
          GameStop Kenya IPTV — Premium streaming service with local support.
          Questions? WhatsApp <strong>+254 700 123 456</strong> or{' '}
          <Link href="/contact" className="text-violet-400 hover:underline">
            contact us
          </Link>.
        </p>
      </div>

      <Footer />
    </div>
  );
}
