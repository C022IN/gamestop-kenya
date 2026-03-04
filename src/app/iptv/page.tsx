'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Tv,
  Wifi,
  Globe,
  Shield,
  Star,
  Check,
  Smartphone,
  Monitor,
  Tablet,
  Play,
  Zap,
  HeadphonesIcon,
  Trophy,
  Clock,
  DollarSign,
} from 'lucide-react';

const plans = [
  {
    id: '3mo',
    name: '3 Months',
    usdPrice: 29.99,
    usdOriginal: 89.97,
    kesPrice: 4499,
    kesOriginal: 13496,
    perMonth: '$10.00/mo',
    savePct: 67,
    popular: false,
    badge: 'SAVE 67%',
    features: [
      '20,000+ Live Channels',
      'Full HD, HD & 4K Quality',
      'All Sports — EPL, NFL, NBA, F1',
      'UFC & Boxing PPV Included — $0 Extra',
      '100K+ Movies & TV Shows',
      '24/7 Live Support',
      '1 screen at a time',
      'Instant activation',
    ],
  },
  {
    id: '6mo',
    name: '6 Months',
    usdPrice: 59.99,
    usdOriginal: 179.94,
    kesPrice: 8999,
    kesOriginal: 26991,
    perMonth: '$10.00/mo',
    savePct: 67,
    popular: false,
    badge: 'SAVE 67%',
    features: [
      '20,000+ Live Channels',
      'Full HD, HD & 4K Quality',
      'All Sports — EPL, NFL, NBA, F1',
      'UFC & Boxing PPV Included — $0 Extra',
      '100K+ Movies & TV Shows',
      '24/7 Live Support',
      '1 screen at a time',
      'Instant activation',
    ],
  },
  {
    id: '12mo',
    name: '12 Months',
    usdPrice: 99.99,
    usdOriginal: 399.88,
    kesPrice: 14999,
    kesOriginal: 59982,
    perMonth: '$8.33/mo',
    savePct: 75,
    popular: true,
    badge: 'BEST VALUE — 75% OFF',
    savings: '$300',
    features: [
      '20,000+ Live Channels',
      'Full HD, HD & 4K Quality',
      'All Sports — EPL, NFL, NBA, F1',
      'UFC & Boxing PPV Included — $0 Extra',
      '100K+ Movies & TV Shows',
      'Priority 24/7 Live Support',
      '1 screen at a time',
      'Instant activation',
    ],
  },
  {
    id: '24mo',
    name: '2 Years',
    usdPrice: 149.99,
    usdOriginal: 799.76,
    kesPrice: 22499,
    kesOriginal: 119964,
    perMonth: '$6.25/mo',
    savePct: 80,
    popular: false,
    badge: 'MAX SAVINGS — 80% OFF',
    savings: '$650',
    features: [
      '20,000+ Live Channels',
      'Full HD, HD & 4K Quality',
      'All Sports — EPL, NFL, NBA, F1',
      'UFC & Boxing PPV Included — $0 Extra',
      '100K+ Movies & TV Shows',
      'VIP Priority 24/7 Support',
      '1 screen at a time',
      'Instant activation',
      '🔥 Best deal ever offered',
    ],
  },
];

const features = [
  {
    icon: Tv,
    title: '20,000+ Live Channels',
    description: 'Access live TV from 198 countries — sports, news, entertainment, kids, and local Kenyan channels including Citizen TV, NTV, KTN, and more.',
    color: 'bg-purple-600',
  },
  {
    icon: Trophy,
    title: '$0 PPV Events',
    description: 'UFC, Boxing, Wrestling — all Pay-Per-View events included at no extra charge. Save $80+ per event you would otherwise pay for.',
    color: 'bg-yellow-500',
  },
  {
    icon: Globe,
    title: 'All Sports Live',
    description: 'EPL, La Liga, Champions League, NFL, NBA, F1 — every game, live, with zero blackouts. Never miss a match again.',
    color: 'bg-green-600',
  },
  {
    icon: Play,
    title: '100K+ Movies & Shows',
    description: 'Massive on-demand library — the latest Netflix, HBO, Disney+ and more. New content added every single day.',
    color: 'bg-red-600',
  },
  {
    icon: Zap,
    title: 'Crystal Clear 4K',
    description: 'Ultra HD quality with anti-buffering technology for smooth, uninterrupted playback on any internet connection.',
    color: 'bg-blue-600',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Live Support',
    description: 'Real humans, instant help via WhatsApp or live chat. Average response time: under 3 minutes. We are always here.',
    color: 'bg-pink-600',
  },
];

const devices = [
  { icon: Tv, name: 'Apple TV' },
  { icon: Tv, name: 'Firestick' },
  { icon: Tv, name: 'Smart TV' },
  { icon: Tv, name: 'Roku' },
  { icon: Smartphone, name: 'Android' },
  { icon: Smartphone, name: 'iPhone/iPad' },
  { icon: Monitor, name: 'Browser' },
  { icon: Tablet, name: 'NVIDIA Shield' },
];

const comparisonWithout = [
  { name: 'Netflix Premium', cost: '$22.99/mo' },
  { name: 'Disney+', cost: '$13.99/mo' },
  { name: 'HBO Max', cost: '$15.99/mo' },
  { name: 'Sports Package', cost: '$40.00/mo' },
  { name: 'PPV Events (avg/year)', cost: '$800+' },
];

const faqs = [
  {
    q: 'What is IPTV and how does it work?',
    a: 'IPTV (Internet Protocol Television) streams live TV channels and on-demand content over your internet connection instead of satellite or cable. No dish, no decoder, no contracts — just install the app and start watching.',
  },
  {
    q: 'How do I get a free 24-hour trial?',
    a: 'Visit www.ppvarena.com and request your free 24-hour trial. Spots are limited. You\'ll receive login credentials instantly after submitting your request.',
  },
  {
    q: 'What internet speed do I need?',
    a: 'Minimum 10 Mbps for HD, 25 Mbps for 4K. Safaricom Home Fibre, Zuku, or any 4G/5G connection works perfectly.',
  },
  {
    q: 'Can I pay with M-Pesa?',
    a: 'Yes! Pay via M-Pesa, credit/debit card, or bank transfer. Contact us on WhatsApp (+254 700 123 456) for M-Pesa payment instructions after choosing your plan.',
  },
  {
    q: 'Are PPV events really free?',
    a: 'Yes. All UFC, Boxing, and Wrestling Pay-Per-View events are included in your subscription at no extra charge — saving you $80+ per event.',
  },
  {
    q: 'Do you have local Kenyan channels?',
    a: 'Yes. Citizen TV, NTV, KTN, K24, Switch TV, KBC, and many more local Kenyan and East African channels are included.',
  },
  {
    q: 'Is there a money-back guarantee?',
    a: '100% yes. PPV Arena offers a 7-day money-back guarantee. Not satisfied? Get a full refund — no questions asked.',
  },
  {
    q: 'How many devices can I use?',
    a: 'Each subscription supports 1 screen at a time. Multi-connection packages are available on request via WhatsApp for families or offices.',
  },
];

function FlashCountdown() {
  const [time, setTime] = useState({ h: 5, m: 50, s: 56 });

  useEffect(() => {
    const end = Date.now() + (time.h * 3600 + time.m * 60 + time.s) * 1000;
    const id = setInterval(() => {
      const diff = Math.max(0, end - Date.now());
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-2 text-white font-mono">
      {[time.h, time.m, time.s].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="bg-red-700 px-3 py-2 rounded-lg text-2xl font-black min-w-[3rem] text-center">{pad(v)}</span>
          {i < 2 && <span className="text-red-300 font-bold text-xl">:</span>}
        </span>
      ))}
    </div>
  );
}

export default function IPTVPage() {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleCurrency = () =>
    setCurrency(prev => prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' });

  const getPrice = (plan: typeof plans[0]) =>
    currency.code === 'USD' ? `$${plan.usdPrice}` : `KSh ${plan.kesPrice.toLocaleString()}`;

  const getOriginalPrice = (plan: typeof plans[0]) =>
    currency.code === 'USD' ? `$${plan.usdOriginal}` : `KSh ${plan.kesOriginal.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
            </div>
            <span className="text-gray-300 text-sm">4.8/5 from 53,000+ customers</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            Every Fight. Every Game. Every Show.{' '}
            <span className="text-purple-400">One Price.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-4">
            Stop paying for 6+ streaming services. Get every sport, every show, every PPV event in one place.
            No blackouts. No restrictions.
          </p>
          <p className="text-yellow-400 font-bold text-lg mb-8">Save Over $1,700 Annually vs Cable + Streaming</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg font-bold rounded-xl">
                Start Streaming Now
              </Button>
            </a>
            <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 px-8 py-6 text-lg font-bold rounded-xl">
                Request Free 24h Trial
              </Button>
            </a>
          </div>
          <p className="text-purple-300 text-sm mt-6">
            100% Risk-Free · 7-Day Money-Back Guarantee · Cancel Anytime
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-purple-700 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '20,000+', label: 'Live Channels' },
              { value: '100K+', label: 'Movies & Shows' },
              { value: '198', label: 'Countries' },
              { value: '4.8★', label: '53,000+ Reviews' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-extrabold">{stat.value}</div>
                <div className="text-purple-200 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything You Need in One Place</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            No more juggling multiple subscriptions. Get it all with PPV Arena — available through GameStop Kenya.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className={`${f.color} text-white w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Savings Comparison */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Stop The Subscription Trap</h2>
            <p className="text-gray-400">See how much you're really paying vs. PPV Arena</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Without */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-red-400 font-bold text-lg mb-4 uppercase tracking-wide">Without PPV Arena</h3>
              <div className="space-y-3">
                {comparisonWithout.map((item) => (
                  <div key={item.name} className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.name}</span>
                    <span className="text-gray-400 font-medium">{item.cost}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-700 mt-4 pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Annual Cost</span>
                  <span className="text-red-400">$2,300+</span>
                </div>
              </div>
            </div>
            {/* With */}
            <div className="bg-purple-900/60 rounded-2xl p-6 border border-purple-600">
              <h3 className="text-purple-300 font-bold text-lg mb-4 uppercase tracking-wide">With PPV Arena</h3>
              <div className="space-y-3">
                {['All Streaming Content', 'All Live Sports', 'All PPV Events ($0 Extra)', '20,000+ Channels', '4K Quality', '100K+ VOD Library'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-400 shrink-0" />
                    <span className="text-gray-200">{item}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-purple-700 mt-4 pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Annual Cost</span>
                  <span className="text-green-400">$99.99</span>
                </div>
                <div className="flex justify-between text-sm text-purple-300 mt-1">
                  <span>Just $8.33/month</span>
                  <span className="text-yellow-400 font-bold">Save $1,700+</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
              <Button className="bg-purple-600 hover:bg-purple-700 px-10 py-5 text-lg font-bold rounded-xl">
                Start Saving Today
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Flash Sale Banner */}
      <section className="bg-gradient-to-r from-red-700 to-red-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <p className="text-red-200 text-sm font-semibold uppercase tracking-wider mb-1">🔥 Limited Time Flash Sale</p>
              <p className="text-2xl font-black">Save up to 80% — Prices increase after this promotion!</p>
              <p className="text-red-200 text-sm mt-1">2,847 people are viewing this page right now</p>
            </div>
            <div className="shrink-0">
              <p className="text-red-200 text-sm mb-2 text-center">Sale ends in:</p>
              <FlashCountdown />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section id="plans" className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Choose Your Plan</h2>
            <p className="text-gray-400">All plans include M-Pesa payment. 7-day money-back guarantee.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col border ${
                  plan.popular
                    ? 'bg-purple-700 border-purple-400 ring-2 ring-purple-400 scale-[1.03]'
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-black px-4 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" /> MOST POPULAR
                  </div>
                )}
                <div className={`text-xs font-bold mb-3 px-2 py-1 rounded inline-block self-start ${plan.popular ? 'bg-yellow-400/20 text-yellow-300' : 'bg-green-500/20 text-green-400'}`}>
                  {plan.badge}
                </div>
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="text-gray-400 line-through text-sm mb-1">{getOriginalPrice(plan)}</div>
                <div className="text-3xl font-extrabold mb-1">{getPrice(plan)}</div>
                <div className="text-sm text-purple-300 mb-6">{plan.perMonth}</div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-gray-200">{f}</span>
                    </li>
                  ))}
                </ul>
                <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
                  <Button
                    className={`w-full font-bold py-5 rounded-xl ${
                      plan.popular
                        ? 'bg-white text-purple-800 hover:bg-gray-100'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    Subscribe Now
                  </Button>
                </a>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 space-y-2">
            <div className="flex items-center justify-center gap-6 text-gray-400 text-sm">
              <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-green-400" /> 256-bit SSL Encryption</span>
              <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-green-400" /> 7-Day Money-Back Guarantee</span>
            </div>
            <p className="text-gray-500 text-xs">M-Pesa, Visa, Mastercard, and Airtel Money accepted. Contact us on WhatsApp for M-Pesa payments.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-3">Start Streaming in 3 Steps</h2>
          <p className="text-gray-500 mb-10">No tech skills needed. Be watching in minutes.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Choose Your Plan', desc: 'Pick the subscription that fits your budget — from 3 months to 2 years.' },
              { step: '2', title: 'Instant Activation', desc: 'Get your login credentials via WhatsApp/email within seconds of payment confirmation.' },
              { step: '3', title: 'Start Watching', desc: 'Install on any device and enjoy unlimited content — it\'s that simple!' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl font-black mb-4">
                  {step}
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Devices */}
      <section className="py-14 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Works On Any Device</h2>
            <p className="text-gray-500">Install once, watch everywhere.</p>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 max-w-3xl mx-auto">
            {devices.map((device, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="bg-purple-100 text-purple-700 w-14 h-14 rounded-2xl flex items-center justify-center">
                  <device.icon className="h-7 w-7" />
                </div>
                <span className="text-[10px] font-medium text-gray-500 text-center leading-tight">{device.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-white py-14">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="flex justify-center items-center gap-2 mb-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
              </div>
              <span className="text-2xl font-black">4.8</span>
            </div>
            <p className="text-gray-500 font-medium">4.8 out of 5 • 3,241 reviews</p>
            <h2 className="text-3xl font-bold mt-3">Loved by 53,000+ Customers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'James O.', location: 'Nairobi', text: 'The Premier League in full HD — absolutely incredible. Set up in 10 minutes on my Smart TV. Best investment I\'ve made this year!', plan: '12 Months' },
              { name: 'Amina K.', location: 'Mombasa', text: 'UFC fights included for free?! I used to pay KSh 3,000 per PPV. This is an absolute steal. Customer support was super fast too.', plan: '6 Months' },
              { name: 'Brian M.', location: 'Kisumu', text: 'Works perfectly on my Firestick and my phone. 20,000 channels is no joke. Even has local Kenyan channels. 100% recommend!', plan: '2 Years' },
            ].map((review, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex text-yellow-400 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{review.text}"</p>
                <div>
                  <span className="font-bold text-sm">{review.name}</span>
                  <span className="text-gray-400 text-xs ml-2">· {review.location}</span>
                  <div className="text-xs text-purple-500 mt-0.5">Plan: {review.plan}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Trial CTA */}
      <section className="bg-gradient-to-br from-purple-800 to-purple-950 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Wifi className="h-12 w-12 mx-auto mb-4 text-purple-300" />
          <h2 className="text-3xl font-bold mb-3">100% Risk-Free — Try Before You Subscribe</h2>
          <p className="text-lg text-purple-200 max-w-xl mx-auto mb-4">
            Request a free 24-hour trial and experience 20,000+ channels with full 4K quality. No credit card required.
          </p>
          <p className="text-yellow-400 font-semibold mb-8">Not satisfied? 7-day money-back guarantee — every cent refunded, no questions asked.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
              <Button className="bg-white text-purple-800 hover:bg-gray-100 px-10 py-6 text-lg font-bold rounded-xl">
                Start Streaming Now
              </Button>
            </a>
            <a href="https://wa.me/254700123456?text=Hi!%20I%20want%20to%20subscribe%20to%20IPTV" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/15 px-10 py-6 text-lg font-bold rounded-xl">
                Order via WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-10">Got Questions?</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <button
                type="button"
                className="w-full text-left px-6 py-4 font-semibold flex justify-between items-center text-sm"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {faq.q}
                <span className="text-purple-600 text-xl ml-4 shrink-0">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 text-sm mt-8">
          53,000+ active subscribers right now
        </p>
      </section>

      {/* Bottom note */}
      <div className="bg-gray-900 text-gray-400 text-center py-5 text-xs">
        <p>
          IPTV service provided by{' '}
          <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
            PPV Arena
          </a>{' '}
          — sold through GameStop Kenya. Questions? WhatsApp: +254 700 123 456
        </p>
      </div>

      <Footer />
    </div>
  );
}
