'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSlider from '@/components/HeroSlider';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';

const featuredProducts = [
  {
    id: '1',
    title: "Marvel's Spider-Man 2 — PlayStation 5",
    image: '/images/games/spiderman-2.svg',
    price: 8500,
    originalPrice: 9500,
    platform: 'PS5',
    rating: 4.8,
    inStock: true,
  },
  {
    id: '2',
    title: 'Super Mario Bros. Wonder — Nintendo Switch',
    image: '/images/games/mario-wonder.svg',
    price: 7000,
    platform: 'Switch',
    rating: 4.9,
    inStock: true,
  },
  {
    id: '3',
    title: 'Forza Horizon 5 — Xbox Series X',
    image: '/images/games/forza-horizon-5.svg',
    price: 6500,
    originalPrice: 7500,
    platform: 'Xbox',
    rating: 4.7,
    inStock: true,
  },
  {
    id: '4',
    title: 'Cyberpunk 2077 Ultimate Edition — PC',
    image: '/images/games/cyberpunk-2077.svg',
    price: 5500,
    originalPrice: 8000,
    platform: 'PC',
    rating: 4.5,
    inStock: true,
  },
];

const flashDeals = [
  {
    id: 'f1',
    title: "God of War: Ragnarök — PS5",
    image: '/images/games/god-of-war-ragnarok.svg',
    price: 7200,
    originalPrice: 9500,
    platform: 'PS5',
    rating: 4.9,
    inStock: true,
  },
  {
    id: 'f2',
    title: 'Hogwarts Legacy — Xbox',
    image: '/images/games/hogwarts-legacy.svg',
    price: 5800,
    originalPrice: 8500,
    platform: 'Xbox',
    rating: 4.6,
    inStock: true,
  },
  {
    id: 'f3',
    title: 'Zelda: Tears of the Kingdom — Switch',
    image: '/images/games/zelda-totk.svg',
    price: 6800,
    originalPrice: 8200,
    platform: 'Switch',
    rating: 4.9,
    inStock: true,
  },
  {
    id: 'f4',
    title: 'EA FC 25 — PS5',
    image: '/images/games/ea-fc-25.svg',
    price: 6500,
    originalPrice: 8000,
    platform: 'PS5',
    rating: 4.3,
    inStock: true,
  },
];

const digitalProducts = [
  {
    id: '5',
    title: 'PlayStation Network Card — KSh 2,000',
    image: '/images/digital/psn-card.svg',
    price: 2000,
    platform: 'PlayStation',
    isDigital: true,
    inStock: true,
  },
  {
    id: '6',
    title: 'Xbox Game Pass Ultimate — 3 Months',
    image: '/images/digital/game-pass.svg',
    price: 4500,
    platform: 'Xbox',
    isDigital: true,
    inStock: true,
  },
  {
    id: '7',
    title: 'Nintendo eShop Card — KSh 1,500',
    image: '/images/digital/eshop-card.svg',
    price: 1500,
    platform: 'Nintendo',
    isDigital: true,
    inStock: true,
  },
  {
    id: '8',
    title: 'Steam Wallet Code — KSh 3,000',
    image: '/images/digital/steam-wallet.svg',
    price: 3000,
    platform: 'PC',
    isDigital: true,
    inStock: true,
  },
];

const categories = [
  {
    name: 'Video Games',
    icon: Gamepad2,
    image: '/images/categories/video-games.svg',
    count: '500+',
    href: '/games',
    color: 'text-blue-600',
  },
  {
    name: 'Consoles',
    icon: ShoppingBag,
    image: '/images/categories/consoles.svg',
    count: '50+',
    href: '/consoles',
    color: 'text-purple-600',
  },
  {
    name: 'Digital Codes',
    icon: CreditCard,
    image: '/images/categories/digital-codes.svg',
    count: '100+',
    href: '/digital-store',
    color: 'text-green-600',
  },
  {
    name: 'Accessories',
    icon: Truck,
    image: '/images/categories/accessories.svg',
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
    text: 'Ordered a PS5 on a Friday, got it delivered the same evening in Westlands. Packaging was perfect and price was unbeatable. GameStop Kenya is the real deal!',
    product: 'PlayStation 5',
    date: 'January 2025',
  },
  {
    name: 'Amina Wanjiru',
    location: 'Kilimani',
    rating: 5,
    text: "I bought the Nintendo Switch OLED for my daughter's birthday. The team helped me choose the right bundle and delivery was on time. Very professional service!",
    product: 'Nintendo Switch OLED',
    date: 'February 2025',
  },
  {
    name: 'James Ochieng',
    location: 'Westlands',
    rating: 5,
    text: 'The IPTV subscription has been amazing. 20,000+ channels and the Premier League in full HD. Set up was easy and support helped me configure it in 10 minutes.',
    product: 'Premium IPTV — 3 Months',
    date: 'March 2025',
  },
  {
    name: 'Sandra Cherop',
    location: 'Thika Road',
    rating: 4,
    text: 'Good selection of games and very fair prices. M-Pesa payment was quick and seamless. Got my Xbox Series S within 2 days. Will definitely order again.',
    product: 'Xbox Series S',
    date: 'February 2025',
  },
];

const brands = ['Sony', 'Microsoft', 'Nintendo', 'Razer', 'Logitech', 'SteelSeries', 'HyperX', 'Corsair'];

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
          <span className="bg-gray-900 text-white text-lg font-mono font-bold px-2.5 py-1 rounded-lg min-w-[2.5rem] text-center">
            {pad(val)}
          </span>
          {i < 2 && <span className="text-gray-500 font-bold">:</span>}
        </span>
      ))}
    </div>
  );
}

export default function Home() {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });

  const toggleCurrency = () => {
    setCurrency(prev =>
      prev.code === 'KES'
        ? { code: 'USD', symbol: '$' }
        : { code: 'KES', symbol: 'KSh' }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      {/* Hero Slider */}
      <section className="container mx-auto px-4 py-6">
        <HeroSlider />
      </section>

      {/* Trust Stats Bar */}
      <section className="bg-white border-y border-gray-100 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Users, value: '50,000+', label: 'Happy Customers', color: 'text-blue-600' },
              { icon: Package, value: '10,000+', label: 'Products in Stock', color: 'text-green-600' },
              { icon: Award, value: '6 Years', label: 'Trusted Since 2019', color: 'text-purple-600' },
              { icon: Star, value: '4.9/5', label: 'Customer Rating', color: 'text-yellow-500' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon className={`h-6 w-6 ${color}`} />
                <span className="text-xl font-extrabold text-gray-900">{value}</span>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Shop by Category</h2>
          <Link href="/games" className="text-red-600 text-sm font-semibold flex items-center gap-1 hover:underline">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <Link key={cat.name} href={cat.href}>
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-4 text-center">
                  <cat.icon className={`h-7 w-7 mx-auto mb-1.5 ${cat.color}`} />
                  <h3 className="font-bold text-sm">{cat.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.count} items</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Flash Deals */}
      <section className="bg-white py-10 border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 text-white p-2 rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Flash Deals</h2>
                <p className="text-sm text-gray-500">Limited time offers — grab them before they're gone!</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Ends in:</span>
              <CountdownTimer targetHours={8} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {flashDeals.map((product) => (
              <ProductCard key={product.id} product={product} currency={currency} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Games */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Games</h2>
          <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">View All</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} currency={currency} />
          ))}
        </div>
      </section>

      {/* PlayStation Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-14">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2">
              <span className="bg-blue-500/30 text-blue-200 text-xs font-bold px-3 py-1.5 rounded-full mb-4 inline-block">SONY PLAYSTATION</span>
              <h2 className="text-4xl font-black mb-4">Shop All Things PlayStation</h2>
              <p className="text-blue-200 text-lg mb-6">Discover the latest PS5 games, DualSense controllers, and exclusive digital content.</p>
              <div className="flex gap-3">
                <Link href="/playstation">
                  <Button className="bg-white text-blue-800 hover:bg-blue-50 font-bold px-6">Shop PlayStation</Button>
                </Link>
                <Link href="/digital-store">
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/15">PSN Cards</Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img
                src="/images/banners/ps5-banner.svg"
                alt="PlayStation 5"
                className="w-full max-w-sm drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Digital Store */}
      <section className="bg-gray-900 text-white py-14">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Digital Store</h2>
            <p className="text-gray-400">Instant delivery — get your codes in minutes via email or WhatsApp</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {digitalProducts.map((product) => (
              <ProductCard key={product.id} product={product} currency={currency} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/digital-store">
              <Button className="bg-red-600 hover:bg-red-700 px-8">Browse All Digital Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Nintendo Section */}
      <section className="bg-gradient-to-br from-red-700 to-red-600 text-white py-14">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2 order-2 md:order-1 flex justify-center">
              <img
                src="/images/banners/switch-banner.svg"
                alt="Nintendo Switch OLED"
                className="w-full max-w-sm drop-shadow-2xl"
              />
            </div>
            <div className="md:w-1/2 order-1 md:order-2">
              <span className="bg-red-500/30 text-red-200 text-xs font-bold px-3 py-1.5 rounded-full mb-4 inline-block">NINTENDO</span>
              <h2 className="text-4xl font-black mb-4">Shop All Things Nintendo</h2>
              <p className="text-red-200 text-lg mb-6">Experience gaming anywhere with the Switch OLED and a library of iconic titles.</p>
              <div className="flex gap-3">
                <Link href="/nintendo-switch">
                  <Button className="bg-white text-red-700 hover:bg-red-50 font-bold px-6">Shop Nintendo</Button>
                </Link>
                <Link href="/digital-store">
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/15">eShop Cards</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Xbox Section */}
      <section className="bg-gradient-to-br from-green-800 to-green-700 text-white py-14">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2">
              <span className="bg-green-600/40 text-green-200 text-xs font-bold px-3 py-1.5 rounded-full mb-4 inline-block">MICROSOFT XBOX</span>
              <h2 className="text-4xl font-black mb-4">Shop All Things Xbox</h2>
              <p className="text-green-200 text-lg mb-6">Power your passion with Xbox Series X|S and access to thousands of Game Pass titles.</p>
              <div className="flex gap-3">
                <Link href="/xbox">
                  <Button className="bg-white text-green-800 hover:bg-green-50 font-bold px-6">Shop Xbox</Button>
                </Link>
                <Link href="/digital-store">
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/15">Game Pass</Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img
                src="/images/banners/xbox-banner.svg"
                alt="Xbox Series X"
                className="w-full max-w-sm drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* IPTV Promo Banner */}
      <section className="bg-gradient-to-r from-gray-900 via-purple-950 to-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="md:w-1/2">
              <div className="inline-flex items-center gap-2 bg-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <Tv className="h-3.5 w-3.5" />
                NEW SERVICE
              </div>
              <h2 className="text-4xl font-black mb-4 leading-tight">
                Premium IPTV —{' '}
                <span className="text-purple-400">Stream Everything You Love</span>
              </h2>
              <p className="text-gray-300 text-lg mb-6">
                20,000+ live channels, sports, movies & series in HD & 4K. Works on Smart TV, Android, iPhone, and PC. No cables. No contracts.
              </p>
              <ul className="grid grid-cols-2 gap-2 text-sm text-gray-300 mb-8">
                {['20,000+ Channels', 'Full HD & 4K', 'Sports & PPV', 'Movies & Series', 'Any Device', '24/7 Support'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4 flex-wrap">
                <Link href="/iptv">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-5 font-bold rounded-xl">
                    View Plans
                  </Button>
                </Link>
                <a href="https://www.ppvarena.com" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-purple-400 text-purple-300 hover:bg-purple-900 px-6 py-5 font-bold rounded-xl">
                    Free Trial
                  </Button>
                </a>
              </div>
            </div>
            <div className="md:w-1/2 flex flex-col items-center">
              <div className="bg-purple-900/50 border border-purple-700 rounded-3xl p-8 text-center w-full max-w-sm">
                <Tv className="h-20 w-20 text-purple-400 mx-auto mb-4" />
                <div className="text-5xl font-extrabold text-white mb-1">20,000+</div>
                <div className="text-purple-300 text-lg mb-4">Live Channels Worldwide</div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs text-gray-400">
                  {['Sports', 'Movies', 'Series', 'Kids', 'News', 'Local'].map((c) => (
                    <div key={c} className="bg-gray-800 rounded-lg p-2">{c}</div>
                  ))}
                </div>
              </div>
              <p className="text-yellow-400 text-sm font-medium mt-4">Limited spots available — Start today!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-14 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">What Our Customers Say</h2>
            <p className="text-gray-500">Trusted by 50,000+ gamers across Kenya</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex text-yellow-400 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="border-t border-gray-100 pt-3">
                  <div className="font-bold text-sm text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.location} · {t.date}</div>
                  <div className="text-xs text-red-500 mt-1">Purchased: {t.product}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Partners */}
      <section className="bg-white border-y border-gray-100 py-10">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-400 uppercase tracking-widest mb-6 font-semibold">Official Partners & Brands</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {brands.map((brand) => (
              <div key={brand} className="text-gray-300 hover:text-gray-600 transition-colors text-xl font-bold">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loyalty Program */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-2xl p-4">
                <Award className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-2xl font-black">GameStop Rewards</h2>
                <p className="text-red-200">Earn points on every purchase. Redeem for discounts & exclusive rewards.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="bg-white text-red-700 hover:bg-red-50 font-bold px-6">Join Free</Button>
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/15">Learn More</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Kenya Features */}
      <section className="bg-green-50 py-14">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">Why Choose GameStop Kenya?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                desc: 'Pay easily with M-Pesa, Airtel Money, Visa, or Mastercard. Instant confirmation.',
              },
              {
                icon: ShoppingBag,
                color: 'bg-green-600',
                title: 'Local Support',
                desc: 'Dedicated 24/7 customer service in Swahili and English. Always here to help.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="text-center">
                <div className={`${color} text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gray-900 text-white py-14">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-2">Stay in the Game</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">Get exclusive deals, new arrivals, and gaming news delivered to your inbox. No spam, ever.</p>
          <div className="max-w-md mx-auto flex gap-3">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
            <Button className="bg-red-600 hover:bg-red-700 px-6 rounded-xl font-bold">Subscribe</Button>
          </div>
          <p className="text-gray-500 text-xs mt-3">Join 50,000+ subscribers. Unsubscribe anytime.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
