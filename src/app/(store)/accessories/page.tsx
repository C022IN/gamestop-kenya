'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Cpu,
  Gauge,
  Headphones,
  SlidersHorizontal,
} from 'lucide-react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { gamingVisuals } from '@/data/gaming-visuals';
import { hardwareCatalog } from '@/data/hardware-catalog';
import { useStoreCurrency } from '@/domains/storefront/hooks/useStoreCurrency';
import { useStorefrontProducts } from '@/domains/storefront/hooks/useStorefrontProducts';

const familyFilters = ['All', 'PlayStation', 'Xbox', 'Nintendo', 'PC', 'Universal'] as const;
const departmentFilters = [
  { id: 'all', label: 'All Gear' },
  { id: 'controller', label: 'Controllers' },
  { id: 'audio', label: 'Headsets' },
  { id: 'sim-racing', label: 'Racing Wheels' },
  { id: 'pc-part', label: 'Graphics Cards' },
] as const;
const controllerIds = [
  'dualsense-wireless-controller',
  'xbox-wireless-controller',
  'switch-pro-controller',
] as const;
const graphicsCardIds = [
  'asus-dual-geforce-rtx-4060-oc-8gb',
  'asus-proart-geforce-rtx-5070-ti-16gb',
  'asus-tuf-radeon-rx-7800-xt-16gb',
  'asus-prime-radeon-rx-9070-xt-16gb',
] as const;

export default function AccessoriesPage() {
  const { currency, toggleCurrency } = useStoreCurrency();
  const [selectedFamily, setSelectedFamily] = useState<(typeof familyFilters)[number]>('All');
  const [selectedDepartment, setSelectedDepartment] =
    useState<(typeof departmentFilters)[number]['id']>('all');
  const mergedHardware = useStorefrontProducts('hardware', hardwareCatalog);

  const productMap = useMemo(
    () => new Map(mergedHardware.map((product) => [product.id, product])),
    [mergedHardware]
  );

  const accessoryProducts = useMemo(
    () => mergedHardware.filter((product) => product.department !== 'console'),
    [mergedHardware]
  );

  const filteredProducts = useMemo(() => {
    return accessoryProducts.filter((product) => {
      const matchesFamily = selectedFamily === 'All' || product.family === selectedFamily;
      const matchesDepartment =
        selectedDepartment === 'all' || product.department === selectedDepartment;

      return matchesFamily && matchesDepartment;
    });
  }, [accessoryProducts, selectedDepartment, selectedFamily]);

  const controllerProducts = controllerIds
    .map((id) => productMap.get(id))
    .filter((product): product is (typeof mergedHardware)[number] => Boolean(product));

  const graphicsCardProducts = graphicsCardIds
    .map((id) => productMap.get(id))
    .filter((product): product is (typeof mergedHardware)[number] => Boolean(product));

  return (
    <div className="min-h-screen bg-[#f4f5f8]">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      <section className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_26%),radial-gradient(circle_at_82%_14%,_rgba(239,68,68,0.16),_transparent_24%),linear-gradient(135deg,_#03131a,_#111827_46%,_#1f2937_100%)] text-white">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Accessories
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Controllers, headsets, racing wheels, and graphics cards.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
                Shop official controllers, premium audio, sim-racing gear, and named GeForce and Radeon cards.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-xl bg-red-600 px-6 font-bold hover:bg-red-700">
                  <Link href="#accessory-catalog">
                    Browse Accessories <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-white/20 bg-transparent px-6 text-white hover:bg-white/10"
                >
                  <Link href="/pc-gaming">Shop PC Gaming</Link>
                </Button>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Headphones, label: 'Audio', value: 'Razer wireless headset' },
                  { icon: Gauge, label: 'Racing', value: 'Logitech G923 wheel + pedals' },
                  { icon: Cpu, label: 'Graphics', value: 'GeForce and Radeon stock' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <Icon className="mb-3 h-5 w-5 text-emerald-200" />
                    <div className="text-sm font-black text-white">{value}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white shadow-[0_22px_60px_rgba(0,0,0,0.28)] md:row-span-2">
                <img
                  src={gamingVisuals.headsetDock.src}
                  alt={gamingVisuals.headsetDock.alt}
                  className="aspect-[4/5] w-full object-cover"
                />
              </article>
              <article className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white shadow-[0_22px_60px_rgba(0,0,0,0.28)]">
                <img
                  src={gamingVisuals.racingSimulator.src}
                  alt={gamingVisuals.racingSimulator.alt}
                  className="aspect-[16/10] w-full object-cover"
                />
              </article>
              <article className="rounded-[1.75rem] border border-white/10 bg-white/10 p-6 text-white backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
                  Graphics Cards
                </p>
                <h2 className="mt-2 text-2xl font-black">GeForce and Radeon stock</h2>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  RTX 4060, RTX 5070 Ti, RX 7800 XT, and RX 9070 XT with clearer price bands.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Platforms', value: 'PlayStation, Xbox, Nintendo, PC' },
              { label: 'Controllers', value: 'DualSense, Xbox, Switch Pro' },
              { label: 'Audio', value: 'Razer BlackShark V2 Pro' },
              { label: 'PC cards', value: 'RTX 4060, RTX 5070 Ti, RX 7800 XT, RX 9070 XT' },
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
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">
            Controllers
          </p>
          <h2 className="mt-2 text-3xl font-black text-gray-900">Official pads for each console</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {controllerProducts.map((product) => (
            <div key={product.id} id={product.id}>
              <ProductCard product={product} currency={currency} />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">
              Graphics Cards
            </p>
            <h2 className="mt-2 text-3xl font-black text-gray-900">GeForce and Radeon options with clear price bands</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {graphicsCardProducts.map((product) => (
              <div key={product.id} id={product.id}>
                <ProductCard product={product} currency={currency} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="accessory-catalog" className="py-14">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">
                Full Catalog
              </p>
              <h2 className="mt-2 text-3xl font-black text-gray-900">Filter by platform and product type</h2>
            </div>

            <Button asChild variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50">
              <Link href="/consoles">Shop Consoles</Link>
            </Button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {familyFilters.map((family) => (
              <button
                key={family}
                type="button"
                onClick={() => setSelectedFamily(family)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedFamily === family
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {family}
              </button>
            ))}
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {departmentFilters.map((department) => (
              <button
                key={department.id}
                type="button"
                onClick={() => setSelectedDepartment(department.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedDepartment === department.id
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                {department.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <div key={product.id} id={product.id}>
                <ProductCard product={product} currency={currency} />
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-gray-900">No accessories match that filter.</p>
              <p className="mt-2 text-sm text-gray-500">
                Change the filters to see more stock.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
