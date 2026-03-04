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
  '🚀 Free delivery in Nairobi for orders above KSh 5,000!',
  '📺 NEW: Premium IPTV — 20,000+ channels from KSh 1,500/month!',
  '🎮 Flash Deal: Up to 40% off selected PS5 & Xbox games today only!',
  '💳 Pay with M-Pesa, Visa, Mastercard, or Airtel Money',
  '📦 Same-day delivery available in Nairobi CBD — order before 2 PM',
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
    { label: 'IPTV', href: '/iptv', badge: 'NEW' },
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      {/* Rotating announcement banner */}
      <div className="bg-red-600 text-white py-2 px-4 text-center text-sm relative overflow-hidden">
        <span
          key={announcementIndex}
          className="inline-block animate-fade-in"
        >
          {announcements[announcementIndex]}
        </span>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
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
              <span className="text-xs text-white bg-green-600 px-2 py-1 rounded font-bold">KENYA</span>
            </Link>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-lg">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games, consoles, accessories..."
                className="w-full px-4 py-2.5 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors text-sm"
              />
              <button
                type="button"
                className="absolute right-0 top-0 h-full px-4 bg-red-600 hover:bg-red-700 text-white rounded-r-xl transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Currency toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={onCurrencyToggle}
              className="hidden sm:flex items-center gap-1.5 hover:bg-red-50 border-gray-200 text-sm font-semibold"
            >
              <Globe className="h-3.5 w-3.5" />
              {currency.code}
            </Button>

            {/* User account */}
            <Button variant="ghost" size="icon" className="hover:bg-red-50 hidden sm:flex">
              <User className="h-5 w-5" />
            </Button>

            {/* Shopping cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative hover:bg-red-50">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden mt-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search games, consoles & more..."
              className="w-full px-4 py-2.5 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors text-sm"
            />
            <button type="button" className="absolute right-0 top-0 h-full px-4 bg-red-600 text-white rounded-r-xl">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`bg-gray-900 text-white ${isMenuOpen ? 'block' : 'hidden md:block'}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-0 py-0 md:py-0">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="relative flex items-center gap-2 px-3 py-3 text-sm hover:bg-gray-800 hover:text-red-400 transition-colors whitespace-nowrap"
              >
                {item.label}
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.badge === 'NEW' ? 'bg-purple-600 text-white' : 'bg-yellow-500 text-black'}`}>
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
