'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  Gamepad2,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { gameCatalog } from '@/data/game-catalog';
import { useStorefrontProducts } from '@/hooks/useStorefrontProducts';

const platformFilters = ['All Platforms', 'PS5', 'Xbox', 'Switch', 'PC'] as const;
const categoryFilters = ['all', 'story', 'sports', 'fighters', 'family', 'racing', 'pre-owned'] as const;
const spotlightPickIds = [
  'marvel-spiderman-2-ps5',
  'forza-horizon-5-xbox',
  'zelda-tears-of-the-kingdom-switch',
] as const;

const editorialGroups = [
  {
    title: 'Story-First Sessions',
    kicker: 'For solo players',
    description: 'High-impact campaigns and cinematic pacing for players who want a premium single-player weekend.',
    productIds: ['marvel-spiderman-2-ps5', 'god-of-war-ragnarok-ps5', 'cyberpunk-2077-ultimate-pc'],
  },
  {
    title: 'Competitive Weekend Picks',
    kicker: 'For squads and rivals',
    description: 'Sports, racing, and fighters for living-room tournaments and after-work energy.',
    productIds: ['ea-fc-25-ps5', 'forza-horizon-5-xbox', 'mortal-kombat-1-xbox'],
  },
  {
    title: 'Budget Library Builders',
    kicker: 'For value hunters',
    description: 'Pre-owned and discounted titles that stretch a gaming budget without feeling second-tier.',
    productIds: ['cyberpunk-2077-pre-owned-ps5', 'forza-horizon-5-pre-owned-xbox', 'hogwarts-legacy-xbox'],
  },
];

export default function GamesPage() {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const [selectedPlatform, setSelectedPlatform] = useState<(typeof platformFilters)[number]>('All Platforms');
  const [selectedCategory, setSelectedCategory] = useState<(typeof categoryFilters)[number]>('all');
  const mergedCatalog = useStorefrontProducts('games', gameCatalog);

  const toggleCurrency = () => {
    setCurrency((prev) =>
      prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' }
    );
  };

  const filteredProducts = useMemo(() => {
    return mergedCatalog.filter((product) => {
      const matchesPlatform =
        selectedPlatform === 'All Platforms' || product.platform === selectedPlatform;
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;
      return matchesPlatform && matchesCategory;
    });
  }, [mergedCatalog, selectedCategory, selectedPlatform]);

  const spotlightPicks = spotlightPickIds
    .map((id) => mergedCatalog.find((product) => product.id === id))
    .filter((product): product is (typeof mergedCatalog)[number] => Boolean(product));

  const editorialSelections = editorialGroups.map((group) => ({
    ...group,
    products: group.productIds
      .map((id) => mergedCatalog.find((product) => product.id === id))
      .filter((product): product is (typeof mergedCatalog)[number] => Boolean(product)),
  }));

  return (
    <div className="min-h-screen bg-[#f4f5f8]">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      <section className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.24),_transparent_28%),radial-gradient(circle_at_82%_14%,_rgba(59,130,246,0.18),_transparent_24%),linear-gradient(135deg,_#030712,_#111827_42%,_#1f2937_100%)] text-white">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-100">
                <Gamepad2 className="h-3.5 w-3.5" />
                Video Games
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Gaming built for Kenyan players who want great art, clear choices, and fast checkout.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
                Browse a cleaner cross-platform catalog with stronger cover art, smarter filters, and a storefront that feels closer to a real gaming retailer instead of a placeholder grid.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-xl bg-red-600 px-6 font-bold hover:bg-red-700">
                  <Link href="#catalog">
                    Browse Games <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-white/20 bg-transparent px-6 text-white hover:bg-white/10"
                >
                  <Link href="/gift-cards">Top Up Gift Cards</Link>
                </Button>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Sparkles, label: 'Curated', value: 'Genre + Platform Filters' },
                  { icon: BadgePercent, label: 'Deals', value: 'Discounted + Pre-Owned Picks' },
                  { icon: ShieldCheck, label: 'Checkout', value: 'M-Pesa + Stripe Ready' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <Icon className="mb-3 h-5 w-5 text-red-200" />
                    <div className="text-sm font-black text-white">{value}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-300">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[28rem]">
              <div className="absolute inset-0 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm" />
              {spotlightPicks.map((product, index) => (
                <div
                  key={product.id}
                  className={`absolute overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/25 shadow-[0_28px_80px_rgba(0,0,0,0.35)] ${
                    index === 0
                      ? 'left-4 top-6 z-20 w-[46%] rotate-[-7deg]'
                      : index === 1
                        ? 'right-8 top-10 z-10 w-[42%] rotate-[8deg]'
                        : 'bottom-6 left-1/2 z-30 w-[48%] -translate-x-1/2 rotate-[-2deg]'
                  }`}
                >
                  <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-200">
                      {product.platform}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">{product.title}</p>
                  </div>
                </div>
              ))}
              <div className="absolute bottom-5 right-5 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 backdrop-blur">
                Nairobi gamers need less guessing and better visuals.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Platforms', value: 'PS5, Xbox, Switch, PC' },
              { label: 'Formats', value: 'New + Pre-Owned' },
              { label: 'Pricing', value: 'KES-first with USD toggle' },
              { label: 'Support', value: 'Local guidance after checkout' },
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
              Editorial Rails
            </p>
            <h2 className="mt-2 text-3xl font-black text-gray-900">Shop by how people actually play</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
              The storefront now groups titles by real buying intent, not just generic platform labels.
            </p>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          {editorialSelections.map((group) => (
            <article
              key={group.title}
              className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-sm"
            >
              <div className="border-b border-gray-100 bg-gradient-to-br from-slate-950 via-slate-900 to-gray-900 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-200">
                  {group.kicker}
                </p>
                <h3 className="mt-2 text-2xl font-black">{group.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{group.description}</p>
              </div>
              <div className="space-y-3 p-4">
                {group.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`#${product.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-red-200 hover:bg-red-50/40"
                  >
                    <div className="w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-1.5">
                      <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
                        <img src={product.image} alt={product.title} className="aspect-[4/5] w-full object-cover" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-semibold text-gray-900">{product.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gray-400">
                        {product.platform} | {product.genre}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="catalog" className="bg-white py-14">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">Full Catalog</p>
              <h2 className="mt-2 text-3xl font-black text-gray-900">Browse all major gaming picks</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
                Covers stay framed consistently, filters stay obvious, and every tile now gives enough context for faster buying decisions.
              </p>
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

          <div className="mb-8 flex flex-wrap gap-2">
            {categoryFilters.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedCategory === category
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                {category === 'all' ? 'All Genres' : category.replace('-', ' ')}
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
              <p className="text-lg font-semibold text-gray-900">No games match that filter yet.</p>
              <p className="mt-2 text-sm text-gray-500">
                Change the platform or genre filter to reopen the full catalog.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#050816] py-14 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-200">Kenya-first storefront quality</p>
              <h2 className="mt-2 text-3xl font-black">The catalog now explains itself faster.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                Better product framing, cleaner visual hierarchy, and stronger genre cues reduce the back-and-forth a buyer needs before trusting the basket.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'Gift cards and games now use different artwork framing so card designs do not get cropped like box art.',
                'Category pages can now be extended with image-driven showcases instead of staying text-only.',
                'The same product visuals feed home, cart recommendations, and catalog browsing more consistently.',
                'Filters and shelf groupings match how many Kenyan shoppers browse: by platform, price pressure, and quick-play intent.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                  <Zap className="mb-3 h-5 w-5 text-red-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
