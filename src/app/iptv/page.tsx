'use client';

import { useState } from 'react';
import Header from '@/components/Header';
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
} from 'lucide-react';

const plans = [
  {
    name: '1 Month',
    price: 1500,
    usdPrice: 10,
    period: 'month',
    popular: false,
    features: [
      '20,000+ Live Channels',
      'Full HD & 4K Quality',
      'Sports & PPV Events',
      'VOD Movies & Series',
      'Multi-device Support',
      '24/7 Customer Support',
    ],
  },
  {
    name: '3 Months',
    price: 3800,
    usdPrice: 25,
    period: '3 months',
    popular: true,
    savings: 'Save 15%',
    features: [
      '20,000+ Live Channels',
      'Full HD & 4K Quality',
      'Sports & PPV Events',
      'VOD Movies & Series',
      'Multi-device Support',
      '24/7 Customer Support',
      'Premium Sports Channels',
    ],
  },
  {
    name: '6 Months',
    price: 6500,
    usdPrice: 43,
    period: '6 months',
    popular: false,
    savings: 'Save 28%',
    features: [
      '20,000+ Live Channels',
      'Full HD & 4K Quality',
      'Sports & PPV Events',
      'VOD Movies & Series',
      'Multi-device Support',
      '24/7 Customer Support',
      'Premium Sports Channels',
      'Adult Content (Optional)',
    ],
  },
  {
    name: '12 Months',
    price: 11000,
    usdPrice: 73,
    period: 'year',
    popular: false,
    savings: 'Save 39%',
    features: [
      '20,000+ Live Channels',
      'Full HD & 4K Quality',
      'Sports & PPV Events',
      'VOD Movies & Series',
      'Multi-device Support',
      '24/7 Customer Support',
      'Premium Sports Channels',
      'Adult Content (Optional)',
      'Priority Support',
    ],
  },
];

const features = [
  {
    icon: Tv,
    title: '20,000+ Channels',
    description: 'Access over 20,000 live TV channels from around the world including local Kenyan and African content.',
    color: 'bg-purple-600',
  },
  {
    icon: Zap,
    title: 'HD & 4K Quality',
    description: 'Enjoy crystal-clear Full HD and 4K streaming quality with minimal buffering on fast connections.',
    color: 'bg-yellow-500',
  },
  {
    icon: Globe,
    title: 'Sports & PPV',
    description: 'Never miss a match. Watch live Premier League, La Liga, Champions League, NBA, UFC and more.',
    color: 'bg-green-600',
  },
  {
    icon: Play,
    title: 'Movies & Series',
    description: 'Thousands of on-demand movies and TV series including the latest Netflix, HBO, and Disney+ content.',
    color: 'bg-red-600',
  },
  {
    icon: Smartphone,
    title: 'Any Device',
    description: 'Stream on Smart TVs, Android, iPhone, iPad, PC, Mac, Firestick, and more. One subscription, all devices.',
    color: 'bg-blue-600',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Support',
    description: 'Round-the-clock customer support via WhatsApp, email, and live chat to keep you streaming.',
    color: 'bg-pink-600',
  },
];

const devices = [
  { icon: Tv, name: 'Smart TV' },
  { icon: Smartphone, name: 'Android' },
  { icon: Smartphone, name: 'iPhone' },
  { icon: Monitor, name: 'PC / Mac' },
  { icon: Tablet, name: 'iPad / Tablet' },
  { icon: Tv, name: 'Firestick' },
];

const faqs = [
  {
    q: 'What is IPTV?',
    a: 'IPTV (Internet Protocol Television) lets you stream live TV channels and on-demand content over your internet connection instead of satellite or cable — no dish, no decoder, no contracts.',
  },
  {
    q: 'How do I get a free trial?',
    a: 'Visit www.ppvarena.com and request your free trial. Spots are limited. You\'ll receive login credentials to test the service on your preferred device before subscribing.',
  },
  {
    q: 'What internet speed do I need?',
    a: 'We recommend at least 10 Mbps for HD streaming and 25 Mbps for 4K. Safaricom Home Fibre or any 4G/5G connection works great.',
  },
  {
    q: 'Can I use M-Pesa to pay?',
    a: 'Yes! You can pay for your IPTV subscription using M-Pesa, credit/debit card, or bank transfer. Payment details are provided after you choose your plan.',
  },
  {
    q: 'How many devices can I use simultaneously?',
    a: 'Standard subscriptions support 1 connection at a time. Multi-connection packages are available on request for families or offices.',
  },
  {
    q: 'Do you have local Kenyan channels?',
    a: 'Yes, we carry Citizen TV, NTV, KTN, K24, Switch TV, KBC, and many more local Kenyan and East African channels.',
  },
];

export default function IPTVPage() {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleCurrency = () => {
    setCurrency(prev =>
      prev.code === 'KES'
        ? { code: 'USD', symbol: '$' }
        : { code: 'KES', symbol: 'KSh' }
    );
  };

  const formatPrice = (plan: typeof plans[0]) => {
    if (currency.code === 'USD') {
      return `$${plan.usdPrice}`;
    }
    return `KSh ${plan.price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <Tv className="h-4 w-4" />
            Premium IPTV Service — Powered by PPV Arena
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Unlimited Entertainment.{' '}
            <span className="text-purple-400">Anytime. Anywhere.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Stream 20,000+ live TV channels, sports, movies & series in Full HD and 4K quality.
            No cables. No contracts. Just instant streaming on any device.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg font-bold rounded-xl">
                Request Free Trial
              </Button>
            </a>
            <a href="#plans">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-6 text-lg font-bold rounded-xl"
              >
                View Plans
              </Button>
            </a>
          </div>
          <p className="text-sm text-yellow-400 mt-6 font-medium">
            Limited spots available — Start streaming today!
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-purple-700 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '20,000+', label: 'Live Channels' },
              { value: 'HD & 4K', label: 'Stream Quality' },
              { value: '6+', label: 'Devices Supported' },
              { value: '24/7', label: 'Customer Support' },
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
          <h2 className="text-3xl font-bold mb-3">Everything You Need to Stream</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            GameStop Kenya brings you access to Africa's best IPTV service. Here's what's included.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className={`${feature.color} text-white w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Plans */}
      <section id="plans" className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Choose Your Plan</h2>
            <p className="text-gray-400">
              All plans include M-Pesa payment. No hidden fees.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  plan.popular
                    ? 'bg-purple-600 ring-4 ring-purple-400 scale-105'
                    : 'bg-gray-800'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3" /> Most Popular
                  </div>
                )}
                {plan.savings && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {plan.savings}
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="text-3xl font-extrabold mb-1">{formatPrice(plan)}</div>
                <div className="text-sm text-gray-300 mb-6">per {plan.period}</div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
                  <Button
                    className={`w-full font-bold py-5 ${
                      plan.popular
                        ? 'bg-white text-purple-700 hover:bg-gray-100'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    Subscribe Now
                  </Button>
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm mt-8">
            All prices in KES. Pay via M-Pesa, credit/debit card, or bank transfer.
          </p>
        </div>
      </section>

      {/* Supported Devices */}
      <section className="py-16 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Works on All Your Devices</h2>
          <p className="text-gray-500">One subscription. Every screen in your home.</p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
          {devices.map((device, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="bg-purple-100 text-purple-700 w-16 h-16 rounded-2xl flex items-center justify-center">
                <device.icon className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium text-gray-700">{device.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Free Trial CTA */}
      <section className="bg-gradient-to-r from-purple-700 to-purple-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Wifi className="h-12 w-12 mx-auto mb-4 text-purple-300" />
          <h2 className="text-3xl font-bold mb-4">Try Before You Subscribe</h2>
          <p className="text-lg text-purple-200 max-w-xl mx-auto mb-8">
            Request a free trial and experience 20,000+ channels with full HD quality — no credit card required.
            Limited spots available.
          </p>
          <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
            <Button className="bg-white text-purple-700 hover:bg-gray-100 px-10 py-6 text-lg font-bold rounded-xl">
              Request Free Trial at ppvarena.com
            </Button>
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100">
              <button
                type="button"
                className="w-full text-left px-6 py-4 font-semibold flex justify-between items-center"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {faq.q}
                <span className="text-purple-600 ml-4 text-xl">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <div className="bg-gray-900 text-gray-400 text-center py-6 text-sm">
        <p>
          IPTV service provided by{' '}
          <a
            href="https://www.ppvarena.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline"
          >
            PPV Arena
          </a>{' '}
          — distributed through GameStop Kenya.
        </p>
      </div>
    </div>
  );
}
