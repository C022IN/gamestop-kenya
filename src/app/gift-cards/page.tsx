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
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GiftCardBuilder from '@/components/GiftCardBuilder';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import {
  giftCardBrands,
  giftCardFaqs,
  giftCardHighlights,
  giftCardProducts,
} from '@/data/gift-cards';

const categoryFilters = [
  { id: 'all', label: 'All Gift Cards' },
  { id: 'store', label: 'Store Gift Cards' },
  { id: 'wallet', label: 'Wallet Cards' },
  { id: 'subscription', label: 'Subscriptions' },
  { id: 'virtual-currency', label: 'Virtual Currency' },
] as const;

export default function GiftCardsPage() {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const [selectedCategory, setSelectedCategory] = useState<(typeof categoryFilters)[number]['id']>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('All brands');

  const toggleCurrency = () => {
    setCurrency((prev) =>
      prev.code === 'KES'
        ? { code: 'USD', symbol: '$' }
        : { code: 'KES', symbol: 'KSh' }
    );
  };

  const filteredProducts = giftCardProducts.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesBrand = selectedBrand === 'All brands' || product.brand === selectedBrand;
    return matchesCategory && matchesBrand;
  });

  const digitalCount = giftCardProducts.filter((product) => product.isDigital).length;
  const physicalCount = giftCardProducts.length - digitalCount;
  const heroFeaturedCard = giftCardProducts[0];
  const heroSupportCards = [giftCardProducts[2], giftCardProducts[4], giftCardProducts[6]];

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
                GameStop-style gift cards for store credit, platform wallets, and instant digital gifting.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-red-100/90 md:text-lg">
                This page is structured after the GameStop gift-card storefront model: quick access to store cards, digital gift cards, subscription codes, and brand-led browsing in one place.
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
                  Inspired by GameStop gift-card framing
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
                    Better fit, cleaner framing, less crop.
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-6 shadow-plan-dark backdrop-blur">
                  <div className="mb-4 inline-flex rounded-full bg-emerald-400/15 p-3 text-emerald-200">
                    <Mail className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-black">Shop Digital Gift Cards</h2>
                  <p className="mt-3 text-sm leading-6 text-gray-200">
                    Last-minute gifting with M-Pesa-ready checkout, fast code fulfillment, and platform wallet options.
                  </p>
                  <div className="mt-6 flex items-center justify-between text-sm text-emerald-200">
                    <span>{digitalCount} digital products</span>
                    <span>Best for instant delivery</span>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-6 shadow-plan-dark backdrop-blur">
                  <div className="mb-4 inline-flex rounded-full bg-amber-300/15 p-3 text-amber-200">
                    <Package className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-black">Shop Physical Gift Cards</h2>
                  <p className="mt-3 text-sm leading-6 text-gray-200">
                    Tangible store cards for gifting, bundles, and mixed checkout orders with regular delivery.
                  </p>
                  <div className="mt-6 flex items-center justify-between text-sm text-amber-100">
                    <span>{physicalCount} physical options</span>
                    <span>Best for hand-delivered gifts</span>
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
                Store cards, digital wallet top-ups, subscription codes, and virtual-currency picks are grouped for a faster browse and a cleaner add-to-cart flow.
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
                      ? 'Best for general store balance, gifting, and flexible basket checkout.'
                      : product.category === 'subscription'
                        ? 'Best for recurring membership access, online services, and month-based plans.'
                        : product.category === 'virtual-currency'
                          ? 'Best for skins, in-game currency, subscriptions, and creator-support spending.'
                          : 'Best for fast wallet top-ups before buying games, DLC, or launch-day content.'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-gray-900">No gift cards match that filter yet.</p>
              <p className="mt-2 text-sm text-gray-500">
                Switch brand or category filters to see more products.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-gray-950 py-14 text-white">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <div>
              <h2 className="text-2xl font-black">Integrated with checkout and payment</h2>
              <p className="text-sm text-gray-400">
                Gift-card orders now flow through the same cart, promo, and payment experience as the rest of the storefront.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {giftCardHighlights.map((highlight) => (
              <div key={highlight} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm leading-6 text-gray-200">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-14">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">Frequently Asked Questions</p>
              <h2 className="mt-2 text-3xl font-black text-gray-900">Gift card support and delivery details</h2>
              <div className="mt-6 space-y-3">
                {giftCardFaqs.map((faq) => (
                  <details key={faq.question} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-900">
                      {faq.question}
                    </summary>
                    <p className="mt-3 text-sm leading-6 text-gray-600">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-red-600 to-red-700 p-8 text-white shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-100">
                Need Help?
              </p>
              <h2 className="mt-2 text-3xl font-black">Check balances, redeem codes, or finish your order fast.</h2>
              <p className="mt-4 text-sm leading-6 text-red-50/90">
                If you need redemption guidance or want to confirm the right card before paying, contact support or head straight to checkout once your cart is ready.
              </p>
              <div className="mt-8 space-y-3">
                <Button asChild className="w-full rounded-xl bg-white font-bold text-red-700 hover:bg-red-50">
                  <Link href="/cart">Review Cart</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-xl border-white/30 bg-transparent font-bold text-white hover:bg-white/10"
                >
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.24em] text-red-100/80">
                Promo code hint: use GAMESTOP10 in cart.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
