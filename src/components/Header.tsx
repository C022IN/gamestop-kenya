'use client';

import { useState, useEffect } from 'react';
import { Search, User, ShoppingCart, Menu, Globe, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

interface Currency {
  code: string;
  symbol: string;
}

interface HeaderProps {
  currency: Currency;
  onCurrencyToggle: () => void;
}

const announcements = [
  'Free delivery in Nairobi for orders above KSh 5,000.',
  'NEW: Premium IPTV - 20,000+ channels from KSh 1,500/month.',
  'Flash deal: up to 40% off selected PS5 and Xbox games today only.',
  'Pay with M-Pesa, Visa, Mastercard, or Airtel Money.',
  'Same-day delivery available in Nairobi CBD - order before 2 PM.',
];

export default function Header({ currency, onCurrencyToggle }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { itemCount } = useCart();

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const navigationItems = [
    { label: 'Trading Cards', href: '/trading-cards' },
    { label: 'Deals', href: '/deals', badge: 'HOT' },
    { label: 'PlayStation', href: '/playstation' },
    { label: 'Nintendo Switch', href: '/nintendo-switch' },
    { label: 'Xbox', href: '/xbox' },
    { label: 'Pre-Owned', href: '/pre-owned' },
    { label: 'Blog', href: '/blog' },
    { label: 'Digital Store', href: '/digital-store' },
    { label: 'Movies', href: '/movies/login', badge: 'NEW' },
    { label: 'IPTV', href: '/iptv', badge: 'NEW' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white shadow-md">
      <div className="bg-red-600 px-4 py-2 text-center text-sm text-white">
        <span key={announcementIndex} className="inline-block animate-fade-in">
          {announcements[announcementIndex]}
        </span>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-black tracking-tight">
                <span className="text-gray-900">Game</span>
                <span className="text-red-600">Stop</span>
              </div>
              <span className="rounded bg-green-600 px-2 py-1 text-xs font-bold text-white">
                KENYA
              </span>
            </Link>
          </div>

          <div className="hidden max-w-lg flex-1 md:flex">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games, consoles, accessories..."
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 pr-12 text-sm transition-colors focus:border-red-500 focus:outline-none"
              />
              <button
                type="button"
                className="absolute right-0 top-0 h-full rounded-r-xl bg-red-600 px-4 text-white transition-colors hover:bg-red-700"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCurrencyToggle}
              className="hidden items-center gap-1.5 border-gray-200 text-sm font-semibold hover:bg-red-50 sm:flex"
            >
              <Globe className="h-3.5 w-3.5" />
              {currency.code}
            </Button>

            <Link href="/movies/login">
              <Button variant="ghost" size="icon" className="hidden hover:bg-red-50 sm:flex">
                <User className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative hover:bg-red-50">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-3 md:hidden">
          <div className="relative">
            <input
              type="text"
              placeholder="Search games, consoles and more..."
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 pr-12 text-sm transition-colors focus:border-red-500 focus:outline-none"
            />
            <button
              type="button"
              className="absolute right-0 top-0 h-full rounded-r-xl bg-red-600 px-4 text-white"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <nav className={`bg-gray-900 text-white ${isMenuOpen ? 'block' : 'hidden md:block'}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-0 py-0 md:flex-row md:items-center">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="relative flex items-center gap-2 whitespace-nowrap px-3 py-3 text-sm transition-colors hover:bg-gray-800 hover:text-red-400"
              >
                {item.label}
                {item.badge && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      item.badge === 'NEW' ? 'bg-purple-600 text-white' : 'bg-yellow-500 text-black'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
