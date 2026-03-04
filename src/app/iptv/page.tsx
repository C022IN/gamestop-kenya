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
  support: string;
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
      'Full HD and 4K stream quality',
      'Sports: EPL, La Liga, UCL, NBA, NFL, F1',
      'UFC and boxing PPV included',
      '100,000+ movies and series',
      'EPG and catch-up support on compatible apps',
      'One active stream at a time',
    ],
    support: 'Standard 24/7 support',
  },
  {
    id: '6mo',
    name: '6 Months',
    months: 6,
    usdPrice: 59.99,
    usdOriginal: 179.94,
    kesPrice: 8999,
    kesOriginal: 26991,
    badge: 'Save 67%',
    features: [
      '20,000+ live channels',
      'Full HD and 4K stream quality',
      'Sports: EPL, La Liga, UCL, NBA, NFL, F1',
      'UFC and boxing PPV included',
      '100,000+ movies and series',
      'EPG and catch-up support on compatible apps',
      'One active stream at a time',
    ],
    support: 'Priority 24/7 support',
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
      'Full HD and 4K stream quality',
      'Sports: EPL, La Liga, UCL, NBA, NFL, F1',
      'UFC and boxing PPV included',
      '100,000+ movies and series',
      'EPG and catch-up support on compatible apps',
      'One active stream at a time',
    ],
    support: 'Priority onboarding and support',
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
      'Full HD and 4K stream quality',
      'Sports: EPL, La Liga, UCL, NBA, NFL, F1',
      'UFC and boxing PPV included',
      '100,000+ movies and series',
      'EPG and catch-up support on compatible apps',
      'One active stream at a time',
    ],
    support: 'VIP support queue',
  },
];

const highlights = [
  {
    icon: Tv,
    title: '20,000+ Live Channels',
    description:
      'International and local TV including sports, movies, kids, news, and East African channels.',
    color: 'bg-violet-600',
  },
  {
    icon: Trophy,
    title: 'PPV Included',
    description:
      'Major UFC, boxing, and wrestling events are included without separate pay-per-view fees.',
    color: 'bg-amber-500',
  },
  {
    icon: Globe,
    title: 'Global Sports Coverage',
    description:
      'Follow major football leagues, motorsport, basketball, and American sports in one package.',
    color: 'bg-emerald-600',
  },
  {
    icon: Zap,
    title: 'Optimized Streaming',
    description:
      'Adaptive quality and CDN routing help reduce buffering during high-demand live events.',
    color: 'bg-blue-600',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Support',
    description:
      'Support available via WhatsApp with setup help and troubleshooting for supported devices.',
    color: 'bg-rose-600',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Checkout',
    description:
      'Pay using M-Pesa, Visa, Mastercard, or Airtel Money with confirmation and support follow-up.',
    color: 'bg-slate-700',
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

const marketComparison = [
  { service: 'Netflix Premium', monthly: '$22.99' },
  { service: 'Disney+', monthly: '$13.99' },
  { service: 'Max', monthly: '$15.99' },
  { service: 'Sports package add-on', monthly: '$40.00' },
  { service: 'PPV events (year average)', monthly: '$800+' },
];

const channelGroups = [
  {
    title: 'Sports Packs',
    items: ['EPL', 'UEFA competitions', 'NBA', 'NFL', 'Formula 1', 'PPV events'],
  },
  {
    title: 'Movies and Series',
    items: ['Hollywood premieres', 'Series box sets', 'International cinema', '24/7 movie channels'],
  },
  {
    title: 'Family and Kids',
    items: ['Kids cartoons', 'Learning channels', 'Family entertainment', 'Lifestyle content'],
  },
  {
    title: 'Regional and Local',
    items: ['Kenyan channels', 'East Africa', 'UK channels', 'US channels', 'Arabic and EU packs'],
  },
];

const connectionOptions = [
  {
    title: 'Single Connection',
    summary: 'Included by default',
    description: 'One stream at a time on any supported device.',
  },
  {
    title: 'Dual Connection',
    summary: 'Family upgrade',
    description: 'Watch simultaneously on two devices in the same household.',
  },
  {
    title: 'Multi Connection',
    summary: 'Power users',
    description: 'Up to four concurrent streams available on request.',
  },
];

const kodiWorkflow = [
  {
    title: 'Xtream API Based',
    detail:
      'Use server URL, username, and password for structured VOD catalog access instead of fragile playlist parsing.',
  },
  {
    title: 'Library File Generation',
    detail:
      'Support workflows that build .strm and .nfo files for local Kodi libraries and cleaner media indexing.',
  },
  {
    title: 'Metadata Enrichment',
    detail:
      'TMDb-backed metadata and artwork can be matched to movies and shows for richer browsing in compatible setups.',
  },
  {
    title: '24-Hour Cache Strategy',
    detail:
      'Catalog fetches should be cached to reduce provider load, lower ban risk, and keep refresh operations predictable.',
  },
  {
    title: 'Compatibility Hygiene',
    detail:
      'Normalize titles and filenames to ASCII-friendly output for better cross-platform behavior across file systems.',
  },
  {
    title: 'Scale Constraints',
    detail:
      'Very large VOD libraries can stress Kodi databases; staged indexing and script-style workflows perform better.',
  },
];

const faqs = [
  {
    q: 'How does IPTV setup work after payment?',
    a: 'After confirmation, account details are sent by WhatsApp or email with device-specific setup steps. Most users complete setup in under 10 minutes.',
  },
  {
    q: 'Can I pay with M-Pesa in Kenya?',
    a: 'Yes. M-Pesa is supported alongside Visa, Mastercard, and Airtel Money. If needed, support can share a direct M-Pesa payment workflow.',
  },
  {
    q: 'What internet speed is recommended?',
    a: 'At least 10 Mbps for HD and 25 Mbps for stable 4K playback. Wired connections are best for large-screen devices during live events.',
  },
  {
    q: 'Do I get local Kenyan channels?',
    a: 'Yes. The package includes local and regional channels along with international categories for sports, movies, and news.',
  },
  {
    q: 'How many devices can stream at once?',
    a: 'Each standard subscription supports one concurrent stream. Multi-connection options are available by request.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'PPV Arena offers a 7-day money-back guarantee based on service terms. Contact support quickly if there is any setup or quality issue.',
  },
  {
    q: 'Can I test before buying a full term?',
    a: 'Yes. A 24-hour trial can be requested through the official PPV Arena page before committing to a plan.',
  },
  {
    q: 'Is there a Kodi workflow for large VOD libraries?',
    a: 'Yes. Power users can run Xtream VOD-to-library workflows with cached updates, metadata generation, and controlled indexing to avoid heavy full-library scans.',
  },
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
          <span className="min-w-[3rem] rounded-lg bg-red-700 px-3 py-2 text-center text-2xl font-black">
            {pad(v)}
          </span>
          {i < 2 && <span className="text-xl font-bold text-red-300">:</span>}
        </span>
      ))}
    </div>
  );
}

function getMonthlyPrice(plan: Plan, currency: Currency): string {
  if (currency.code === 'USD') {
    return `$${(plan.usdPrice / plan.months).toFixed(2)}/mo`;
  }
  return `KSh ${Math.round(plan.kesPrice / plan.months).toLocaleString()}/mo`;
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
                Consolidate multiple streaming subscriptions into one service with broad live sports
                coverage, on-demand content, and local support through GameStop Kenya.
              </p>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-300">Rated 4.8/5 by 53,000+ customers</span>
              </div>
              <div className="flex flex-wrap gap-4">
                <a href="#plans">
                  <Button className="rounded-xl bg-violet-600 px-8 py-6 text-lg font-bold hover:bg-violet-700">
                    View Plans
                  </Button>
                </a>
                <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/35 px-8 py-6 text-lg font-bold text-white hover:bg-white/10"
                  >
                    Request 24h Trial
                  </Button>
                </a>
              </div>
              <p className="mt-5 text-sm text-violet-200">
                7-day money-back guarantee. Cancel anytime based on provider terms.
              </p>
            </div>

            <div className="lux-card rounded-3xl border border-violet-500/30 bg-violet-900/35 p-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-200">
                Limited Offer Window
              </p>
              <p className="mb-4 text-3xl font-black">Save up to 80% on long-term plans</p>
              <p className="mb-5 text-sm text-violet-200">
                Pricing updates automatically after the current promotion period.
              </p>
              <div className="mb-5">
                <p className="mb-2 text-sm text-violet-200">Offer ends in:</p>
                <FlashCountdown />
              </div>
              <div className="space-y-2 text-sm text-violet-100">
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
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-3 text-3xl font-bold">What You Get</h2>
          <p className="text-gray-500">
            Built for viewers who want strong sports coverage, reliable stream quality, and a single
            monthly cost.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((feature) => (
            <article key={feature.title} className="lux-card rounded-2xl p-6">
              <div className={`${feature.color} mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold">Channel Mix and TV Guide</h2>
            <p className="mx-auto max-w-3xl text-gray-500">
              Inspired by leading IPTV storefronts, the catalog is grouped by use case so customers can
              quickly verify sports, movies, local channels, and guide compatibility before buying.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lux-card rounded-2xl p-6 lg:col-span-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {channelGroups.map((group) => (
                  <article key={group.title} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-800">
                      {group.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <aside className="lux-card rounded-2xl bg-violet-950 p-6 text-white">
              <h3 className="mb-3 text-xl font-bold">EPG and Catch-Up</h3>
              <p className="mb-4 text-sm text-violet-200">
                Electronic Program Guide support is available on compatible apps, with catch-up playback
                on selected channels where provider data is available.
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  'Browse what is live and next from a TV guide view',
                  'Replay selected content from recent broadcast windows',
                  'Works best on premium IPTV player apps',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span className="text-violet-100">{point}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-16 text-white">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold">Cost Comparison</h2>
            <p className="text-gray-400">What many viewers pay across separate services each month.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="lux-card rounded-2xl border border-gray-700 bg-gray-900/70 p-6">
              <h3 className="mb-4 text-lg font-bold text-red-400">Multiple separate subscriptions</h3>
              <div className="space-y-3">
                {marketComparison.map((item) => (
                  <div key={item.service} className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.service}</span>
                    <span className="font-medium text-gray-200">{item.monthly}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-gray-700 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Estimated annual spend</span>
                  <span className="text-red-400">$2,300+</span>
                </div>
              </div>
            </div>
            <div className="lux-card rounded-2xl border border-violet-600 bg-violet-900/40 p-6">
              <h3 className="mb-4 text-lg font-bold text-violet-300">Single consolidated package</h3>
              <div className="space-y-3">
                {[
                  'Live TV and sports',
                  'Movies and series library',
                  'PPV events included',
                  '4K-capable channels',
                  'Device flexibility',
                  'Support from setup to playback',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-gray-200">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-violet-700 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Annual plan starts at</span>
                  <span className="text-emerald-400">$99.99</span>
                </div>
                <div className="mt-1 flex justify-between text-sm text-violet-200">
                  <span>Approx. $8.33/month</span>
                  <span className="font-semibold text-amber-300">Potential savings: $1,700+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-14">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold">Connection Options</h2>
            <p className="text-gray-500">
              Single-stream is standard. Multi-connection upgrades are available for families and shared setups.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-3">
            {connectionOptions.map((option) => (
              <article key={option.title} className="lux-card rounded-2xl p-6 text-center">
                <h3 className="mb-1 text-lg font-bold">{option.title}</h3>
                <p className="mb-3 text-sm font-semibold text-violet-700">{option.summary}</p>
                <p className="text-sm text-gray-600">{option.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="mb-2 text-3xl font-bold">Kodi Power User Workflow</h2>
            <p className="text-gray-500">
              Based on proven Xtream VOD add-on patterns, these are the technical capabilities advanced users
              typically expect when managing large libraries.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {kodiWorkflow.map((item) => (
              <article key={item.title} className="lux-card rounded-2xl p-5">
                <h3 className="mb-2 text-base font-bold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{item.detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-sm text-violet-900">
            <span className="font-semibold">Implementation note:</span> this workflow is for media indexing and
            navigation convenience only. It does not provide content by itself.
          </div>
        </div>
      </section>

      <section id="plans" className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold">Choose Your Plan</h2>
            <p className="text-gray-400">All plans include full channel access, setup help, and secure checkout.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.popular
                    ? 'lux-card scale-[1.02] border-violet-300 bg-violet-700 ring-2 ring-violet-300'
                    : 'lux-card border-gray-700 bg-gray-800/80'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-black text-gray-900">
                    MOST POPULAR
                  </div>
                )}
                <span
                  className={`mb-3 inline-block self-start rounded px-2 py-1 text-xs font-bold ${
                    plan.popular ? 'bg-amber-300/25 text-amber-200' : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {plan.badge}
                </span>
                <h3 className="mb-1 text-xl font-bold">{plan.name}</h3>
                <p className="mb-1 text-sm text-gray-300 line-through">{getOriginalPrice(plan, currency)}</p>
                <p className="mb-1 text-3xl font-extrabold">{getPrice(plan, currency)}</p>
                <p className="mb-5 text-sm text-violet-200">{getMonthlyPrice(plan, currency)}</p>
                <ul className="mb-5 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span className="text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="mb-5 text-xs text-violet-200">{plan.support}</p>
                <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
                  <Button
                    className={`w-full rounded-xl py-5 font-bold ${
                      plan.popular
                        ? 'bg-white text-violet-800 hover:bg-gray-100'
                        : 'bg-violet-600 text-white hover:bg-violet-700'
                    }`}
                  >
                    Subscribe Now
                  </Button>
                </a>
              </article>
            ))}
          </div>
          <div className="mt-8 space-y-2 text-center">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> 256-bit SSL encryption
              </span>
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-400" /> 7-day money-back window
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Payments supported: M-Pesa, Visa, Mastercard, Airtel Money.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-3 text-3xl font-bold">Activation in 3 Steps</h2>
          <p className="mb-10 text-gray-500">Designed for quick setup without technical complexity.</p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Choose a plan',
                desc: 'Pick the duration that matches your viewing habits and budget.',
              },
              {
                step: '2',
                title: 'Pay securely',
                desc: 'Complete payment with M-Pesa or card and receive confirmation quickly.',
              },
              {
                step: '3',
                title: 'Start streaming',
                desc: 'Use the setup guide for your device and begin watching immediately.',
              },
            ].map((item) => (
              <article key={item.step} className="lux-card rounded-2xl p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-2xl font-black text-white">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-14">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold">Supported Devices</h2>
            <p className="text-gray-500">Use one account across the devices you already own.</p>
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

      <section className="bg-white py-14">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <span className="text-2xl font-black">4.8</span>
            </div>
            <p className="font-medium text-gray-500">4.8 out of 5 based on verified customer feedback</p>
            <h2 className="mt-3 text-3xl font-bold">What Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                name: 'James O.',
                location: 'Nairobi',
                plan: '12 Months',
                text: 'Setup on my Smart TV was straightforward. Football streams stayed stable through weekend matchdays.',
              },
              {
                name: 'Amina K.',
                location: 'Mombasa',
                plan: '6 Months',
                text: 'I moved from multiple apps to one package and monthly spending dropped immediately.',
              },
              {
                name: 'Brian M.',
                location: 'Kisumu',
                plan: '24 Months',
                text: 'Works on Firestick and mobile. Support replied quickly when I needed help with account activation.',
              },
            ].map((review) => (
              <article key={review.name} className="lux-card rounded-2xl p-6">
                <div className="mb-3 flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-gray-600">"{review.text}"</p>
                <div>
                  <span className="text-sm font-bold">{review.name}</span>
                  <span className="ml-2 text-xs text-gray-500">| {review.location}</span>
                  <div className="mt-0.5 text-xs text-violet-600">Plan: {review.plan}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-violet-800 to-violet-950 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <Wifi className="mx-auto mb-4 h-12 w-12 text-violet-200" />
          <h2 className="mb-3 text-3xl font-bold">Try Before You Commit</h2>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-violet-200">
            Request a free 24-hour trial to evaluate stream quality, channel lineup, and compatibility on your devices.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
              <Button className="rounded-xl bg-white px-10 py-6 text-lg font-bold text-violet-800 hover:bg-gray-100">
                Start Trial
              </Button>
            </a>
            <a
              href="https://wa.me/254700123456?text=Hi!%20I%20want%20to%20subscribe%20to%20IPTV"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="rounded-xl border-white/40 px-10 py-6 text-lg font-bold text-white hover:bg-white/15"
              >
                Order on WhatsApp
              </Button>
            </a>
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
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-violet-600 transition-transform ${
                    openFaq === i ? 'rotate-180' : ''
                  }`}
                />
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
          <a
            href="https://www.ppvarena.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:underline"
          >
            PPV Arena
          </a>
          , distributed through GameStop Kenya. Need help? WhatsApp +254 700 123 456.
        </p>
      </div>

      <Footer />
    </div>
  );
}
