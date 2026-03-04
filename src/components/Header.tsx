'use client';

import { useState } from 'react';
import { Search, User, ShoppingCart, Menu, Globe } from 'lucide-react';
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

export default function Header({ currency, onCurrencyToggle }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { itemCount } = useCart();

  const navigationItems = [
    'Trading Cards',
    'Deals',
    'PlayStation',
    'Nintendo Switch',
    'Xbox',
    'Pre-Owned',
    'Blog',
    'Digital Store',
    'IPTV'
  ];

  return (
    <header className="bg-white shadow-md">
      {/* Top promotional banner */}
      <div className="bg-red-600 text-white py-2 px-4 text-center text-sm">
        <span>Free delivery in Nairobi for orders above KSh 5,000!</span>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                <span className="text-black">Game</span>
                <span className="text-red-600">Stop</span>
              </div>
              <span className="text-sm text-white bg-green-600 px-2 py-1 rounded font-semibold">KENYA</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search games, consoles & more"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Currency toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={onCurrencyToggle}
              className="hidden sm:flex items-center space-x-2 hover:bg-red-50 border-red-300"
            >
              <Globe className="h-4 w-4" />
              <span className="font-semibold">{currency.code}</span>
            </Button>

            {/* User account */}
            <Button variant="ghost" size="icon" className="hover:bg-red-50">
              <User className="h-5 w-5" />
            </Button>

            {/* Shopping cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative hover:bg-red-50">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search games, consoles & more"
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`bg-gray-900 text-white ${isMenuOpen ? 'block' : 'hidden md:block'}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:space-x-8 py-3">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item === 'Blog' ? '/blog' : `/${item.toLowerCase().replace(' ', '-')}`}
                className="text-left py-2 md:py-0 hover:text-red-400 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
