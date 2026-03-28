'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  Gamepad2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { gamingVisuals } from '@/data/gaming-visuals';
import { gameCatalog } from '@/data/game-catalog';
import { useStoreCurrency } from '@/hooks/useStoreCurrency';
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
    description: 'Big single-player campaigns for weekend sessions.',
    productIds: ['marvel-spiderman-2-ps5', 'god-of-war-ragnarok-ps5', 'cyberpunk-2077-ultimate-pc'],
  },
  {
    title: 'Competitive Weekend Picks',
    kicker: 'For squads and rivals',
    description: 'Sports, racing, and fighters for quick competitive sessions.',
    productIds: ['ea-fc-25-ps5', 'forza-horizon-5-xbox', 'mortal-kombat-1-xbox'],
  },
  {
    title: 'Budget Library Builders',
    kicker: 'For value hunters',
    description: 'Pre-owned and discounted picks for tighter budgets.',
    productIds: ['cyberpunk-2077-pre-owned-ps5', 'forza-horizon-5-pre-owned-xbox', 'hogwarts-legacy-xbox'],
  },
];

export default function GamesPage() {
  const { currency, toggleCurrency } = useStoreCurrency();
  const [selectedPlatform, setSelectedPlatform] = useState<(typeof platformFilters)[number]>('All Platforms');
  const [selectedCategory, setSelectedCategory] = useState<(typeof categoryFilters)[number]>('all');
  const mergedCatalog = useStorefrontProducts('games', gameCatalog);

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
                Shop PS5, Xbox, Switch, and PC games in one shelf.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
                New releases, pre-owned picks, and fast KES-first checkout.
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
                  { icon: Sparkles, label: 'Browse', value: 'PS5, Xbox, Switch, PC' },
                  { icon: BadgePercent, label: 'Deals', value: 'New + Pre-Owned Picks' },
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

            <div className="grid gap-4">
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
                <img
                  src={gamingVisuals.gamesHero.src}
                  alt={gamingVisuals.gamesHero.alt}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {spotlightPicks.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-200">
                      {product.platform}
                    </p>
                    <h2 className="mt-2 text-base font-black text-white">{product.title}</h2>
                    <p className="mt-2 text-sm text-slate-200">KSh {product.price.toLocaleString()}</p>
                  </div>
                ))}
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
              Curated Picks
            </p>
            <h2 className="mt-2 text-3xl font-black text-gray-900">Shop by how you want to play</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
              Start with story-heavy games, competitive favorites, or lower-cost library builders.
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
                Filter by platform or genre to narrow the shelf quickly.
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

      <Footer />
    </div>
  );
}
