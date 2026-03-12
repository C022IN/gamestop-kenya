'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Gamepad2,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { hardwareCatalog } from '@/data/hardware-catalog';
import { useStorefrontProducts } from '@/hooks/useStorefrontProducts';

const platformFilters = ['All', 'PlayStation', 'Xbox', 'Nintendo'] as const;
const heroIds = [
  'ps5-console-slim',
  'xbox-series-x-console',
  'nintendo-switch-oled-console',
] as const;
const starterAddonIds = [
  'dualsense-wireless-controller',
  'xbox-wireless-controller',
  'switch-pro-controller',
  'razer-blackshark-v2-pro-2023',
] as const;

export default function ConsolesPage() {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const [selectedPlatform, setSelectedPlatform] = useState<(typeof platformFilters)[number]>('All');
  const mergedHardware = useStorefrontProducts('hardware', hardwareCatalog);

  const toggleCurrency = () => {
    setCurrency((prev) =>
      prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' }
    );
  };

  const productMap = useMemo(
    () => new Map(mergedHardware.map((product) => [product.id, product])),
    [mergedHardware]
  );

  const heroProducts = heroIds
    .map((id) => productMap.get(id))
    .filter((product): product is (typeof mergedHardware)[number] => Boolean(product));

  const consoleProducts = useMemo(
    () => mergedHardware.filter((product) => product.department === 'console'),
    [mergedHardware]
  );

  const starterAddons = starterAddonIds
    .map((id) => productMap.get(id))
    .filter((product): product is (typeof mergedHardware)[number] => Boolean(product));

  const filteredProducts = useMemo(() => {
    return consoleProducts.filter((product) => {
      return selectedPlatform === 'All' || product.platform === selectedPlatform;
    });
  }, [consoleProducts, selectedPlatform]);

  return (
    <div className="min-h-screen bg-[#f4f5f8]">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      <section className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.24),_transparent_26%),radial-gradient(circle_at_85%_20%,_rgba(59,130,246,0.18),_transparent_24%),linear-gradient(135deg,_#030712,_#111827_46%,_#1f2937_100%)] text-white">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-100">
                <Boxes className="h-3.5 w-3.5" />
                Consoles
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                PlayStation, Xbox, and Nintendo consoles.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
                Shop current console stock with clean product cards, pricing in KES, and add-on controllers ready in the same basket.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-xl bg-red-600 px-6 font-bold hover:bg-red-700">
                  <Link href="#console-catalog">
                    Browse Consoles <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-white/20 bg-transparent px-6 text-white hover:bg-white/10"
                >
                  <Link href="/accessories">Add Controllers And Audio</Link>
                </Button>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Gamepad2, label: 'Platforms', value: 'PlayStation, Xbox, Nintendo' },
                  { icon: Truck, label: 'Delivery', value: 'Nairobi dispatch and national shipping' },
                  { icon: ShieldCheck, label: 'Payments', value: 'M-Pesa, Stripe, and tracked orders' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <Icon className="mb-3 h-5 w-5 text-red-200" />
                    <div className="text-sm font-black text-white">{value}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-300">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[29rem]">
              <div className="absolute inset-0 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm" />
              {heroProducts.map((product, index) => (
                <div
                  key={product.id}
                  className={`absolute overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/25 shadow-[0_28px_80px_rgba(0,0,0,0.35)] ${
                    index === 0
                      ? 'left-4 top-6 z-20 w-[48%] rotate-[-7deg]'
                      : index === 1
                        ? 'right-6 top-8 z-10 w-[44%] rotate-[7deg]'
                        : 'bottom-5 left-1/2 z-30 w-[52%] -translate-x-1/2 rotate-[-2deg]'
                  }`}
                >
                  <div className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="aspect-[16/10] w-full object-contain p-3"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-200">
                      {product.platform}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">{product.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Console stock', value: 'PlayStation, Xbox, Nintendo' },
              { label: 'Price display', value: 'KES first with quick USD toggle' },
              { label: 'Add-ons', value: 'Controllers and headsets on the same store' },
              { label: 'Support', value: 'Compatibility help before and after purchase' },
            ].map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
                  {fact.label}
                </p>
                <p className="mt-2 text-sm font-bold text-gray-900">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-14">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">
              Console Catalog
            </p>
            <h2 className="mt-2 text-3xl font-black text-gray-900">Choose the system that matches how you play</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {platformFilters.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => setSelectedPlatform(platform)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedPlatform === platform
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        <div id="console-catalog" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div key={product.id} id={product.id}>
              <ProductCard product={product} currency={currency} />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">
                Starter Add-Ons
              </p>
              <h2 className="mt-2 text-3xl font-black text-gray-900">Pair the console with the gear buyers usually need next</h2>
            </div>
            <Button asChild variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50">
              <Link href="/accessories">See All Accessories</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {starterAddons.map((product) => (
              <div key={product.id} id={product.id}>
                <ProductCard product={product} currency={currency} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#050816] py-14 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              'PlayStation fits buyers chasing premium single-player releases and DualSense features.',
              'Xbox fits buyers who want Game Pass, strong performance, and flexible digital libraries.',
              'Nintendo fits families, travel setups, and multiplayer sessions around Switch exclusives.',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-200"
              >
                <CheckCircle2 className="mb-3 h-5 w-5 text-red-300" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
