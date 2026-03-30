'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  CreditCard,
  Gift,
  Mail,
  MessageCircleMore,
  Package,
  WalletCards,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GiftCardBuilder from '@/components/GiftCardBuilder';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import {
  giftCardBrands,
  giftCardProducts,
} from '@/data/gift-cards';
import { useStoreCurrency } from '@/domains/storefront/hooks/useStoreCurrency';
import { useStorefrontProducts } from '@/domains/storefront/hooks/useStorefrontProducts';

const categoryFilters = [
  { id: 'all', label: 'All Gift Cards' },
  { id: 'store', label: 'Store Gift Cards' },
  { id: 'wallet', label: 'Wallet Cards' },
  { id: 'subscription', label: 'Subscriptions' },
  { id: 'virtual-currency', label: 'Virtual Currency' },
] as const;

export default function GiftCardsPage() {
  const { currency, toggleCurrency } = useStoreCurrency();
  const [selectedCategory, setSelectedCategory] = useState<(typeof categoryFilters)[number]['id']>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('All brands');
  const products = useStorefrontProducts('gift-cards', giftCardProducts);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesBrand = selectedBrand === 'All brands' || product.brand === selectedBrand;
    return matchesCategory && matchesBrand;
  });

  const digitalCount = products.filter((product) => product.isDigital).length;
  const physicalCount = products.length - digitalCount;
  const heroProducts = products.length > 0 ? products : giftCardProducts;
  const heroFeaturedCard = heroProducts[0] ?? {
    title: 'GameStop Kenya Gift Card',
    image: '/images/digital/gamestop-card.svg',
  };
  const heroSupportCards = [2, 4, 6]
    .map((index) => heroProducts[index] ?? giftCardProducts[index])
    .filter((card): card is (typeof giftCardProducts)[number] => Boolean(card));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      <section className="overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.14),_transparent_22%),linear-gradient(135deg,_#09090B,_#7F1D1D_50%,_#111827)] text-white">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-100">
                <Gift className="h-3.5 w-3.5" />
                Gift Cards
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Gift cards for store credit, wallets, and digital delivery.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-red-100/90 md:text-lg">
                Store cards, wallet top-ups, and subscriptions in one checkout.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-xl bg-white px-6 font-bold text-red-700 hover:bg-red-50">
                  <Link href="#catalog">
                    Browse Gift Cards <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-white/30 bg-transparent px-6 text-white hover:bg-white/10"
                >
                  <Link href="#gamestop-kenya-gift-card">Build Store Gift Card</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem] border border-white/10 bg-white/8 p-5 shadow-plan-dark backdrop-blur">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(248,250,252,0.16),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(248,113,113,0.22),_transparent_28%)]" />
                <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-red-100">
                  Gift-card layout
                </div>
                <div className="relative h-full">
                  <div className="absolute left-4 top-16 z-20 w-[62%] overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/20 p-4 shadow-[0_26px_70px_rgba(0,0,0,0.32)]">
                    <img
                      src={heroFeaturedCard.image}
                      alt={heroFeaturedCard.title}
                      className="aspect-[16/10] w-full object-contain"
                    />
                  </div>
                  {heroSupportCards.map((card, index) => (
                    <div
                      key={card.id}
                      className={`absolute overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/25 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.28)] ${
                        index === 0
                          ? 'right-4 top-16 w-[34%] rotate-[6deg]'
                          : index === 1
                            ? 'right-10 top-[10.5rem] z-10 w-[36%] rotate-[-8deg]'
                            : 'right-16 top-[15.5rem] w-[30%] rotate-[4deg]'
                      }`}
                    >
                      <img src={card.image} alt={card.title} className="aspect-[16/10] w-full object-contain" />
                    </div>
                  ))}
                  <div className="absolute bottom-5 left-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 backdrop-blur">
                    Cleaner framing.
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-6 shadow-plan-dark backdrop-blur">
                  <div className="mb-4 inline-flex rounded-full bg-emerald-400/15 p-3 text-emerald-200">
                    <Mail className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-black">Digital cards</h2>
                  <p className="mt-3 text-sm leading-6 text-gray-200">
                    Fast wallet and subscription gifting.
                  </p>
                  <div className="mt-6 flex items-center justify-between text-sm text-emerald-200">
                    <span>{digitalCount} digital products</span>
                    <span>Instant delivery</span>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-6 shadow-plan-dark backdrop-blur">
                  <div className="mb-4 inline-flex rounded-full bg-amber-300/15 p-3 text-amber-200">
                    <Package className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-black">Physical cards</h2>
                  <p className="mt-3 text-sm leading-6 text-gray-200">
                    Physical cards for gifting.
                  </p>
                  <div className="mt-6 flex items-center justify-between text-sm text-amber-100">
                    <span>{physicalCount} physical options</span>
                    <span>Hand-delivered gifts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              { icon: WalletCards, label: 'Gift Card Types', value: 'Store + Wallet + Subs' },
              { icon: CreditCard, label: 'Payment', value: 'M-Pesa + Cards' },
              { icon: MessageCircleMore, label: 'Support', value: 'WhatsApp Fulfillment' },
              { icon: BadgePercent, label: 'Coupons', value: 'Promo-aware Checkout' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/15 p-4 backdrop-blur">
                <Icon className="mb-3 h-5 w-5 text-red-200" />
                <div className="text-xl font-black text-white">{value}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-red-100/80">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
              Popular brands
            </span>
            <button
              type="button"
              onClick={() => setSelectedBrand('All brands')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedBrand === 'All brands'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All brands
            </button>
            {giftCardBrands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedBrand === brand
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 md:py-14">
        <GiftCardBuilder currency={currency} />
      </section>

      <section id="catalog" className="bg-white py-14">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">
                Full Catalog
              </p>
              <h2 className="mt-2 text-3xl font-black text-gray-900">
                Browse all gift cards by type and brand
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
                Filter by type or brand for a faster browse.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedCategory(filter.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    selectedCategory === filter.id
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="space-y-3">
                <ProductCard product={product} currency={currency} />
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                      {product.brand}
                    </span>
                    <span className="text-xs font-medium text-gray-500">{product.formatLabel}</span>
                  </div>
                  <p className="text-sm leading-6 text-gray-600">
                    {product.category === 'store'
                      ? 'Best for store balance and gifting.'
                      : product.category === 'subscription'
                        ? 'Best for memberships and online services.'
                        : product.category === 'virtual-currency'
                          ? 'Best for in-game currency and subscriptions.'
                          : 'Best for fast wallet top-ups.'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-gray-900">No gift cards match that filter yet.</p>
              <p className="mt-2 text-sm text-gray-500">
                Change the brand or category filter.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
