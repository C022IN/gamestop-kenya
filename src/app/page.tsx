'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import HeroSlider from '@/components/HeroSlider';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Gamepad2, CreditCard, Truck } from 'lucide-react';

export default function Home() {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });

  const toggleCurrency = () => {
    setCurrency(prev =>
      prev.code === 'KES'
        ? { code: 'USD', symbol: '$' }
        : { code: 'KES', symbol: 'KSh' }
    );
  };

  // Sample product data
  const featuredProducts = [
    {
      id: '1',
      title: 'Marvel\'s Spider-Man 2 - PlayStation 5',
      image: 'https://via.placeholder.com/300x400/1f2937/ffffff?text=Spider-Man+2+PS5',
      price: 8500,
      originalPrice: 9500,
      platform: 'PS5',
      rating: 4.8,
      inStock: true
    },
    {
      id: '2',
      title: 'Super Mario Bros. Wonder - Nintendo Switch',
      image: 'https://via.placeholder.com/300x400/dc2626/ffffff?text=Mario+Wonder+Switch',
      price: 7000,
      platform: 'Switch',
      rating: 4.9,
      inStock: true
    },
    {
      id: '3',
      title: 'Forza Horizon 5 - Xbox Series X',
      image: 'https://via.placeholder.com/300x400/16a34a/ffffff?text=Forza+5+Xbox',
      price: 6500,
      originalPrice: 7500,
      platform: 'Xbox',
      rating: 4.7,
      inStock: true
    },
    {
      id: '4',
      title: 'Cyberpunk 2077 Ultimate Edition - PC',
      image: 'https://via.placeholder.com/300x400/6b7280/ffffff?text=Cyberpunk+2077+PC',
      price: 5500,
      originalPrice: 8000,
      platform: 'PC',
      rating: 4.2,
      inStock: true
    }
  ];

  const digitalProducts = [
    {
      id: '5',
      title: 'PlayStation Network Card - KSh 2000',
      image: 'https://via.placeholder.com/300x400/2563eb/ffffff?text=PSN+Card+2000',
      price: 2000,
      platform: 'PlayStation',
      isDigital: true,
      inStock: true
    },
    {
      id: '6',
      title: 'Xbox Live Gold 12 Months',
      image: 'https://via.placeholder.com/300x400/16a34a/ffffff?text=Xbox+Live+Gold',
      price: 4500,
      platform: 'Xbox',
      isDigital: true,
      inStock: true
    },
    {
      id: '7',
      title: 'Nintendo eShop Card - KSh 1500',
      image: 'https://via.placeholder.com/300x400/dc2626/ffffff?text=eShop+Card+1500',
      price: 1500,
      platform: 'Nintendo',
      isDigital: true,
      inStock: true
    },
    {
      id: '8',
      title: 'Steam Wallet Code - KSh 3000',
      image: 'https://via.placeholder.com/300x400/1f2937/ffffff?text=Steam+Wallet+3000',
      price: 3000,
      platform: 'PC',
      isDigital: true,
      inStock: true
    }
  ];

  const categories = [
    { name: 'Video Games', icon: Gamepad2, image: 'https://via.placeholder.com/400x200/1f2937/ffffff?text=Video+Games', count: '500+' },
    { name: 'Consoles', icon: ShoppingBag, image: 'https://via.placeholder.com/400x200/2563eb/ffffff?text=Consoles', count: '50+' },
    { name: 'Digital Codes', icon: CreditCard, image: 'https://via.placeholder.com/400x200/16a34a/ffffff?text=Digital+Codes', count: '100+' },
    { name: 'Accessories', icon: Truck, image: 'https://via.placeholder.com/400x200/dc2626/ffffff?text=Accessories', count: '200+' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8">
        <HeroSlider />
      </section>

      {/* Quick Categories */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-32 object-cover rounded-t-lg"
              />
              <div className="p-4 text-center">
                <category.icon className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.count} items</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Games</h2>
          <Button variant="outline">View All</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
            />
          ))}
        </div>
      </section>

      {/* PlayStation Section */}
      <section className="bg-blue-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-4xl font-bold mb-4">Shop All Things PlayStation</h2>
              <p className="text-xl mb-6">Discover the latest PS5 games, accessories, and digital content</p>
              <Button className="bg-white text-blue-600 hover:bg-gray-100">
                Shop PlayStation
              </Button>
            </div>
            <div className="md:w-1/2">
              <img
                src="https://via.placeholder.com/400x400/ffffff/2563eb?text=PlayStation+5"
                alt="PlayStation 5"
                className="w-full max-w-md mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Digital Store */}
      <section className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Digital Store</h2>
            <p className="text-lg">Instant delivery of digital codes and gift cards</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {digitalProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Nintendo Section */}
      <section className="bg-red-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2">
              <img
                src="https://via.placeholder.com/400x400/ffffff/dc2626?text=Nintendo+Switch"
                alt="Nintendo Switch"
                className="w-full max-w-md mx-auto"
              />
            </div>
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-4xl font-bold mb-4">Shop All Things Nintendo</h2>
              <p className="text-xl mb-6">Experience gaming anywhere with Nintendo Switch</p>
              <Button className="bg-white text-red-600 hover:bg-gray-100">
                Shop Nintendo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Xbox Section */}
      <section className="bg-green-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-4xl font-bold mb-4">Shop All Things Xbox</h2>
              <p className="text-xl mb-6">Power your dreams with Xbox Series X|S</p>
              <Button className="bg-white text-green-600 hover:bg-gray-100">
                Shop Xbox
              </Button>
            </div>
            <div className="md:w-1/2">
              <img
                src="https://via.placeholder.com/400x400/ffffff/16a34a?text=Xbox+Series+X"
                alt="Xbox Series X"
                className="w-full max-w-md mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Kenya Features */}
      <section className="bg-green-100 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-green-800">Why Choose GameStop Kenya?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Free delivery in Nairobi for orders above KSh 5,000</p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">M-Pesa Ready</h3>
              <p className="text-gray-600">Pay easily with M-Pesa, cards, or mobile money</p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Support</h3>
              <p className="text-gray-600">Dedicated customer service in Swahili and English</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-2xl font-bold">
                  <span className="text-white">Game</span>
                  <span className="text-red-600">Stop</span>
                </div>
                <span className="text-sm text-green-400 bg-green-800 px-2 py-1 rounded">KENYA</span>
              </div>
              <p className="text-gray-400">Kenya's premier gaming destination for consoles, games, and digital content.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Track Order</a></li>
                <li><a href="#" className="hover:text-white">Return Policy</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">PlayStation</a></li>
                <li><a href="#" className="hover:text-white">Xbox</a></li>
                <li><a href="#" className="hover:text-white">Nintendo</a></li>
                <li><a href="#" className="hover:text-white">PC Gaming</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📧 support@gamestop.co.ke</li>
                <li>📱 +254 700 123 456</li>
                <li>🏢 Nairobi, Kenya</li>
                <li>⏰ Mon-Sat: 9AM-8PM</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 GameStop Kenya. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
