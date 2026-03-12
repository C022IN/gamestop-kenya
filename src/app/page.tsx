'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSlider from '@/components/HeroSlider';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { gamingVisuals } from '@/data/gaming-visuals';
import { hardwareCatalog } from '@/data/hardware-catalog';
import {
  getFeaturedGames,
  getFlashDeals,
} from '@/data/game-catalog';
import { giftCardProducts } from '@/data/gift-cards';
import { useStorefrontProducts } from '@/hooks/useStorefrontProducts';
import {
  ShoppingBag,
  Gamepad2,
  CreditCard,
  Truck,
  Tv,
  Star,
  Users,
  Package,
  Award,
  ChevronRight,
  Zap,
  Clock,
  Check,
} from 'lucide-react';

const featuredFallbackProducts = getFeaturedGames();
const flashDealFallbackProducts = getFlashDeals();
const digitalFallbackProducts = giftCardProducts.slice(0, 4);
const hardwareFallbackProducts = hardwareCatalog;

const categoryBlueprints = [
  {
    name: 'Video Games',
    icon: Gamepad2,
    featuredImage: gamingVisuals.gamesHero.src,
    fallbackImage: '/images/categories/video-games.svg',
    count: '500+',
    href: '/games',
    color: 'text-blue-600',
  },
  {
    name: 'Consoles',
    icon: ShoppingBag,
    featuredImage: gamingVisuals.playstationConsole.src,
    fallbackImage: '/images/categories/consoles.svg',
    count: '50+',
    href: '/consoles',
    color: 'text-purple-600',
  },
  {
    name: 'Gift Cards',
    icon: CreditCard,
    fallbackImage: '/images/categories/digital-codes.svg',
    count: '150+',
    href: '/gift-cards',
    color: 'text-green-600',
  },
  {
    name: 'Accessories',
    icon: Truck,
    featuredImage: gamingVisuals.headsetDock.src,
    fallbackImage: '/images/categories/accessories.svg',
    count: '200+',
    href: '/accessories',
    color: 'text-red-600',
  },
];

const testimonials = [
  {
    name: 'Brian Mutua',
    location: 'Nairobi CBD',
    rating: 5,
    text: 'Ordered a PS5 on Friday and received it the same evening in Westlands. Packaging was secure and pricing was fair.',
    product: 'PlayStation 5',
    date: 'January 2025',
  },
  {
    name: 'Amina Wanjiru',
    location: 'Kilimani',
    rating: 5,
    text: 'I bought the Nintendo Switch OLED as a birthday gift. The support team recommended the right bundle and delivered on time.',
    product: 'Nintendo Switch OLED',
    date: 'February 2025',
  },
  {
    name: 'James Ochieng',
    location: 'Westlands',
    rating: 5,
    text: 'The IPTV package works perfectly. Setup took less than 10 minutes and support helped immediately when I needed guidance.',
    product: 'Premium IPTV - 3 Months',
    date: 'March 2025',
  },
  {
    name: 'Sandra Cherop',
    location: 'Thika Road',
    rating: 4,
    text: 'Great game selection and smooth M-Pesa checkout. My Xbox arrived in two days exactly as promised.',
    product: 'Xbox Series S',
    date: 'February 2025',
  },
];

const brands = [
  'Sony',
  'Microsoft',
  'Nintendo',
  'Razer',
  'Logitech',
  'SteelSeries',
  'HyperX',
  'Corsair',
];

function CountdownTimer({ targetHours = 8 }: { targetHours?: number }) {
  const [timeLeft, setTimeLeft] = useState({ h: targetHours, m: 0, s: 0 });

  useEffect(() => {
    const end = Date.now() + targetHours * 3600 * 1000;
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ h, m, s });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetHours]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-2">
      {[timeLeft.h, timeLeft.m, timeLeft.s].map((val, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="min-w-[2.5rem] rounded-lg bg-gray-900 px-2.5 py-1 text-center font-mono text-lg font-bold text-white">
            {pad(val)}
          </span>
          {i < 2 && <span className="font-bold text-gray-500">:</span>}
        </span>
      ))}
    </div>
  );
}

export default function Home() {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const featuredProducts = useStorefrontProducts('games', featuredFallbackProducts);
  const flashDeals = useStorefrontProducts('games', flashDealFallbackProducts);
  const digitalProducts = useStorefrontProducts('gift-cards', digitalFallbackProducts);
  const hardwareProducts = useStorefrontProducts('hardware', hardwareFallbackProducts);

  const toggleCurrency = () => {
    setCurrency((prev) =>
      prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' }
    );
  };

  const hardwareMap = useMemo(
    () => new Map(hardwareProducts.map((product) => [product.id, product])),
    [hardwareProducts]
  );

  const categories = categoryBlueprints.map((category) => ({
    ...category,
    image:
      'featuredImage' in category && category.featuredImage
        ? category.featuredImage
        : category.name === 'Video Games'
          ? featuredProducts[0]?.image ?? category.fallbackImage
          : category.fallbackImage,
  }));

  const hardwareSpotlights = [
    'ps5-console-slim',
    'razer-blackshark-v2-pro-2023',
    'asus-proart-geforce-rtx-5070-ti-16gb',
    'asus-prime-radeon-rx-9070-xt-16gb',
  ]
    .map((id) => hardwareMap.get(id))
    .filter((product): product is (typeof hardwareProducts)[number] => Boolean(product));

  const ps5Image = hardwareMap.get('ps5-console-slim')?.image ?? '/images/banners/ps5-banner.svg';
  const switchImage =
    hardwareMap.get('nintendo-switch-oled-console')?.image ?? '/images/banners/switch-banner.svg';
  const xboxImage = hardwareMap.get('xbox-series-x-console')?.image ?? '/images/banners/xbox-banner.svg';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      <section className="container mx-auto px-4 py-6">
        <HeroSlider />
      </section>

      <section className="border-y border-gray-100 bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {[
              { icon: Users, value: '50,000+', label: 'Happy Customers', color: 'text-blue-600' },
              { icon: Package, value: '10,000+', label: 'Products in Stock', color: 'text-green-600' },
              { icon: Award, value: '6 Years', label: 'Trusted Since 2019', color: 'text-purple-600' },
              { icon: Star, value: '4.9/5', label: 'Customer Rating', color: 'text-yellow-500' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="lux-card rounded-xl p-4">
                <Icon className={`mx-auto mb-2 h-6 w-6 ${color}`} />
                <span className="block text-xl font-extrabold text-gray-900">{value}</span>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Shop by Category</h2>
          <Link
            href="/games"
            className="flex items-center gap-1 text-sm font-semibold text-red-600 hover:underline"
          >
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {categories.map((cat) => (
            <Link key={cat.name} href={cat.href}>
              <div className="lux-card group cursor-pointer overflow-hidden rounded-2xl">
                <div className="lux-media h-32">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-4 text-center">
                  <cat.icon className={`mx-auto mb-1.5 h-7 w-7 ${cat.color}`} />
                  <h3 className="text-sm font-bold">{cat.name}</h3>
                  <p className="mt-0.5 text-xs text-gray-500">{cat.count} items</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-100 bg-white py-10">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-600 p-2 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Flash Deals</h2>
                <p className="text-sm text-gray-500">
                  Limited-time offers. Reserve these prices before they expire.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Ends in:</span>
              <CountdownTimer targetHours={8} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {flashDeals.map((product) => (
              <ProductCard key={product.id} product={product} currency={currency} />
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured Games</h2>
          <Link href="/games">
            <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
              View All
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} currency={currency} />
          ))}
        </div>
      </section>

      <section className="border-y border-gray-100 bg-white py-10">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Featured Hardware</h2>
              <p className="text-sm text-gray-500">PS5, premium audio, and current GeForce and Radeon cards.</p>
            </div>
            <Link href="/accessories">
              <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                View Hardware
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {hardwareSpotlights.map((product) => (
              <ProductCard key={product.id} product={product} currency={currency} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-900 to-blue-700 py-14 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="md:w-1/2">
              <span className="mb-4 inline-block rounded-full bg-blue-500/30 px-3 py-1.5 text-xs font-bold text-blue-200">
                SONY PLAYSTATION
              </span>
              <h2 className="mb-4 text-4xl font-black">Shop All Things PlayStation</h2>
              <p className="mb-6 text-lg text-blue-200">
                Discover the latest PS5 games, DualSense controllers, and premium digital content.
              </p>
              <div className="flex gap-3">
                <Link href="/playstation">
                  <Button className="bg-white px-6 font-bold text-blue-800 hover:bg-blue-50">
                    Shop PlayStation
                  </Button>
                </Link>
                <Link href="/gift-cards">
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/15">
                    PSN Cards
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl">
                <img
                  src={ps5Image}
                  alt="PlayStation 5"
                  className="h-[320px] w-full object-contain bg-white p-6"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-14 text-white">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold">Gift Cards & Digital Codes</h2>
            <p className="text-gray-400">
              Shop store cards, wallet top-ups, subscriptions, and instant gifting in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {digitalProducts.map((product) => (
              <ProductCard key={product.id} product={product} currency={currency} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/gift-cards">
              <Button className="bg-red-600 px-8 hover:bg-red-700">
                Browse All Gift Cards
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-red-700 to-red-600 py-14 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="order-2 md:order-1 md:w-1/2">
              <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl">
                <img
                  src={switchImage}
                  alt="Nintendo Switch OLED"
                  className="h-[320px] w-full object-contain bg-white p-6"
                />
              </div>
            </div>
            <div className="order-1 md:order-2 md:w-1/2">
              <span className="mb-4 inline-block rounded-full bg-red-500/30 px-3 py-1.5 text-xs font-bold text-red-200">
                NINTENDO
              </span>
              <h2 className="mb-4 text-4xl font-black">Shop All Things Nintendo</h2>
              <p className="mb-6 text-lg text-red-200">
                Experience gaming anywhere with Switch OLED hardware and a strong first-party catalog.
              </p>
              <div className="flex gap-3">
                <Link href="/nintendo-switch">
                  <Button className="bg-white px-6 font-bold text-red-700 hover:bg-red-50">
                    Shop Nintendo
                  </Button>
                </Link>
                <Link href="/gift-cards">
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/15">
                    eShop Cards
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-green-800 to-green-700 py-14 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="md:w-1/2">
              <span className="mb-4 inline-block rounded-full bg-green-600/40 px-3 py-1.5 text-xs font-bold text-green-200">
                MICROSOFT XBOX
              </span>
              <h2 className="mb-4 text-4xl font-black">Shop All Things Xbox</h2>
              <p className="mb-6 text-lg text-green-200">
                Power your setup with Xbox Series X|S and a huge library through Game Pass.
              </p>
              <div className="flex gap-3">
                <Link href="/xbox">
                  <Button className="bg-white px-6 font-bold text-green-800 hover:bg-green-50">
                    Shop Xbox
                  </Button>
                </Link>
                <Link href="/gift-cards">
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/15">
                    Game Pass
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl">
                <img src={xboxImage} alt="Xbox Series X" className="h-[320px] w-full object-contain bg-white p-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-gray-900 via-violet-950 to-gray-900 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-10 md:flex-row">
            <div className="md:w-1/2">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
                <Tv className="h-3.5 w-3.5" />
                NEW SERVICE
              </div>
              <h2 className="mb-4 text-4xl font-black leading-tight">
                Premium IPTV - <span className="text-violet-400">One Member Hub for Every Screen</span>
              </h2>
              <p className="mb-6 text-lg text-gray-300">
                Activate with M-Pesa, open your protected member hub, and manage live TV, movies, series, and sports from one clean interface.
              </p>
              <ul className="mb-8 grid grid-cols-2 gap-2 text-sm text-gray-300">
                {['Protected member login', 'Playlist-ready playback', 'Live TV and VOD hub', 'Sports event slots', 'Any Device', '24/7 Support'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" /> {f}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4">
                <Link href="/iptv">
                  <Button className="rounded-xl bg-violet-600 px-6 py-5 font-bold text-white hover:bg-violet-700">
                    View Plans
                  </Button>
                </Link>
                <Link href="/movies/login">
                  <Button
                    variant="outline"
                    className="rounded-xl border-violet-400 px-6 py-5 font-bold text-violet-300 hover:bg-violet-900"
                  >
                    Member Login
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="lux-card rounded-3xl border border-violet-700/80 bg-violet-900/40 p-8 text-center">
                <Tv className="mx-auto mb-4 h-20 w-20 text-violet-400" />
                <div className="mb-1 text-5xl font-extrabold text-white">1</div>
                <div className="mb-4 text-lg text-violet-300">Unified IPTV Member Hub</div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs text-gray-300">
                  {['Live TV', 'Movies', 'Series', 'Sports', 'M-Pesa', 'Support'].map((c) => (
                    <div key={c} className="rounded-lg bg-gray-800 p-2">
                      {c}
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-center text-sm font-medium text-amber-300">
                Limited slots available. Start today.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-14">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold">What Our Customers Say</h2>
            <p className="text-gray-500">Trusted by 50,000+ gamers across Kenya</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, i) => (
              <div key={i} className="lux-card rounded-2xl p-6">
                <div className="mb-3 flex text-yellow-400">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-gray-600">"{t.text}"</p>
                <div className="border-t border-gray-200 pt-3">
                  <div className="text-sm font-bold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">
                    {t.location} | {t.date}
                  </div>
                  <div className="mt-1 text-xs text-red-500">Purchased: {t.product}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-white py-10">
        <div className="container mx-auto px-4">
          <p className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-gray-400">
            Official Partners and Brands
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {brands.map((brand) => (
              <div key={brand} className="text-xl font-bold text-gray-300 transition-colors hover:text-gray-700">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-red-600 to-red-700 py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white/20 p-4">
                <Award className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-2xl font-black">GameStop Rewards</h2>
                <p className="text-red-100">
                  Earn points on every purchase and redeem them for discounts and exclusive drops.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="bg-white px-6 font-bold text-red-700 hover:bg-red-50">Join Free</Button>
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/15">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-green-50 py-14">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">
            Why Choose GameStop Kenya?
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: Truck,
                color: 'bg-green-600',
                title: 'Fast Delivery',
                desc: 'Same-day delivery within Nairobi CBD. Free delivery for orders above KSh 5,000.',
              },
              {
                icon: CreditCard,
                color: 'bg-green-600',
                title: 'M-Pesa Ready',
                desc: 'Pay easily with M-Pesa, Airtel Money, Visa, or Mastercard with instant confirmation.',
              },
              {
                icon: ShoppingBag,
                color: 'bg-green-600',
                title: 'Local Support',
                desc: 'Dedicated support team available in English and Swahili for quick issue resolution.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="lux-card rounded-2xl p-6 text-center">
                <div className={`${color} mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{title}</h3>
                <p className="leading-relaxed text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-900 py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-2 text-3xl font-bold">Stay in the Game</h2>
          <p className="mx-auto mb-8 max-w-md text-gray-400">
            Get exclusive deals, new arrivals, and gaming news sent directly to your inbox.
          </p>
          <div className="mx-auto flex max-w-md gap-3">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <Button className="rounded-xl bg-red-600 px-6 font-bold hover:bg-red-700">
              Subscribe
            </Button>
          </div>
          <p className="mt-3 text-xs text-gray-500">Join 50,000+ subscribers. Unsubscribe anytime.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
