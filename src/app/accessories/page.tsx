'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Cpu,
  Gauge,
  Headphones,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { hardwareCatalog } from '@/data/hardware-catalog';
import { useStorefrontProducts } from '@/hooks/useStorefrontProducts';

const familyFilters = ['All', 'PlayStation', 'Xbox', 'Nintendo', 'PC', 'Universal'] as const;
const departmentFilters = [
  { id: 'all', label: 'All Gear' },
  { id: 'controller', label: 'Controllers' },
  { id: 'audio', label: 'Headsets' },
  { id: 'sim-racing', label: 'Sim Racing' },
  { id: 'pc-part', label: 'PC Parts' },
  { id: 'peripheral', label: 'Keyboards + Mice' },
] as const;
const heroIds = [
  'dualsense-wireless-controller',
  'wireless-gaming-headset',
  'logitech-g923-racing-wheel',
] as const;
const controllerIds = [
  'dualsense-wireless-controller',
  'xbox-wireless-controller',
  'switch-pro-controller',
] as const;
const pcSetupIds = [
  'geforce-rtx-graphics-card',
  'mechanical-gaming-keyboard',
  'wireless-gaming-mouse',
] as const;

export default function AccessoriesPage() {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const [selectedFamily, setSelectedFamily] = useState<(typeof familyFilters)[number]>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<(typeof departmentFilters)[number]['id']>('all');
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

  const heroProducts = heroIds
    .map((id) => productMap.get(id))
    .filter((product): product is (typeof mergedHardware)[number] => Boolean(product));

  const controllerProducts = controllerIds
    .map((id) => productMap.get(id))
    .filter((product): product is (typeof mergedHardware)[number] => Boolean(product));

  const pcSetupProducts = pcSetupIds
    .map((id) => productMap.get(id))
    .filter((product): product is (typeof mergedHardware)[number] => Boolean(product));

  const heroLead = heroProducts[0];

  return (
    <div className="min-h-screen bg-[#f4f5f8]">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      <section className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_26%),radial-gradient(circle_at_82%_14%,_rgba(239,68,68,0.18),_transparent_24%),linear-gradient(135deg,_#03131a,_#111827_46%,_#1f2937_100%)] text-white">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Gaming Accessories
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Controllers, headsets, PC parts, and sim gear with visuals that sell the setup properly.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
                The accessory catalog now covers platform pads, audio, racing gear, keyboards, mice, and graphics hardware with cleaner product photography across the storefront.
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
                  <Link href="/pc-gaming">Explore PC Gaming</Link>
                </Button>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Sparkles, label: 'Visual quality', value: 'Clearer product framing' },
                  { icon: Headphones, label: 'Use cases', value: 'Controllers, audio, racing, PC gear' },
                  { icon: Cpu, label: 'Upgrade path', value: 'Small add-on or full desk rebuild' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <Icon className="mb-3 h-5 w-5 text-emerald-200" />
                    <div className="text-sm font-black text-white">{value}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-300">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {heroProducts.map((product, index) => (
                <article
                  key={product.id}
                  className={`overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur ${
                    index === 0 ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-4">
                    <img src={product.image} alt={product.title} className="aspect-[16/10] w-full rounded-[1.35rem] object-cover" />
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
                      {product.platform} | {product.department.replace('-', ' ')}
                    </p>
                    <h2 className="mt-2 text-lg font-black text-white">{product.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-300">{product.blurb}</p>
                  </div>
                </article>
              ))}
              {heroLead && (
                <div className="rounded-[1.75rem] border border-emerald-300/20 bg-emerald-400/10 p-5 text-sm leading-6 text-emerald-50 md:col-span-2">
                  Strong accessory photos matter because buyers need to understand comfort, controls, and desktop footprint before they trust the cart.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Supported ecosystems', value: 'PlayStation, Xbox, Nintendo, PC' },
              { label: 'Core categories', value: 'Controllers, audio, PC parts, sim gear' },
              { label: 'Shopping flow', value: 'Shared cart with consoles, games, and gift cards' },
              { label: 'Media system', value: 'Fallback photos plus DB-managed overrides' },
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
            Controllers First
          </p>
          <h2 className="mt-2 text-3xl font-black text-gray-900">Pads for every major platform</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            PlayStation, Xbox, and Nintendo buyers can now compare controller choices with much cleaner presentation instead of guessing from placeholder art.
          </p>
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
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">
                PC Desk Build
              </p>
              <h2 className="mt-2 text-3xl font-black text-gray-900">PC parts and peripherals with stronger visual clarity</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
                GPU, keyboard, and mouse picks now sit in the same accessory catalog instead of being implied by text-only PC pages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {pcSetupProducts.map((product) => (
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
                Full Accessory Catalog
              </p>
              <h2 className="mt-2 text-3xl font-black text-gray-900">Filter by platform and hardware type</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
                The catalog now covers everything from sim-racing wheels to headsets and core PC parts in one view.
              </p>
            </div>

            <Button asChild variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50">
              <Link href="/consoles">Shop Consoles Too</Link>
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
              <p className="text-lg font-semibold text-gray-900">No accessories match that filter yet.</p>
              <p className="mt-2 text-sm text-gray-500">
                Switch platform or accessory type to reopen the full gear catalog.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#050816] py-14 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Headphones,
                text: 'Audio gear now reads like a real product lineup instead of a generic accessories bucket.',
              },
              {
                icon: Gauge,
                text: 'Sim-racing hardware is visible on the storefront, which matters for Forza, Gran Turismo, and F1 buyers.',
              },
              {
                icon: Cpu,
                text: 'PC parts are now represented with the same visual quality as console products, which lifts the overall site standard.',
              },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-200"
              >
                <Icon className="mb-3 h-5 w-5 text-red-300" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
