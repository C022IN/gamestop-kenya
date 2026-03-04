'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, CreditCard, Smartphone, Shield, Tag } from 'lucide-react';

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart, itemCount } = useCart();
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const toggleCurrency = () =>
    setCurrency(prev => prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' });

  const formatPrice = (price: number) => {
    const converted = currency.code === 'USD' ? price / 150 : price;
    return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
  };

  const handleQuantityChange = (id: string, qty: number) => {
    if (qty < 1) removeItem(id);
    else updateQuantity(id, qty);
  };

  const shippingCost = total >= 5000 ? 0 : 500;
  const discount = promoApplied ? Math.round(total * 0.1) : 0;
  const finalTotal = total - discount + shippingCost;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currency={currency} onCurrencyToggle={toggleCurrency} />
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
            <p className="text-gray-500 mb-8">Looks like you haven't added anything yet. Start browsing our collection!</p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700 px-8">Continue Shopping</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-500 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <span className="text-gray-400 text-sm">({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Items header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Your Items</h2>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.id} className="p-5">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{item.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.platform}</span>
                          {item.isDigital && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Digital</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <p className="font-bold text-red-600">{formatPrice(item.price * item.quantity)}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-400">{formatPrice(item.price)} each</p>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="px-2.5 py-1.5 hover:bg-gray-50 text-gray-600"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-3 py-1.5 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="px-2.5 py-1.5 hover:bg-gray-50 text-gray-600"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Promo code */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-sm">Promo Code</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
                />
                <Button
                  onClick={() => {
                    if (promoCode === 'GAMESTOP10') setPromoApplied(true);
                  }}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold"
                >
                  Apply
                </Button>
              </div>
              {promoApplied && (
                <p className="text-green-600 text-xs mt-2 font-medium">✓ Promo code applied! 10% discount added.</p>
              )}
              <p className="text-gray-400 text-xs mt-2">Try: GAMESTOP10 for 10% off</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-5">Order Summary</h2>
              <div className="space-y-3 text-sm mb-5">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Promo Discount</span>
                    <span>− {formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? <span className="text-green-600 font-medium">FREE</span> : formatPrice(shippingCost)}</span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-gray-400">
                    Add {formatPrice(5000 - total)} more for free delivery
                  </p>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-red-600">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Payment methods */}
              <div className="mb-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Pay with</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { icon: Smartphone, label: 'M-Pesa', color: 'text-green-600 bg-green-50' },
                    { icon: CreditCard, label: 'Visa', color: 'text-blue-600 bg-blue-50' },
                    { icon: CreditCard, label: 'Mastercard', color: 'text-red-600 bg-red-50' },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/checkout">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-5 text-base font-bold rounded-xl">
                  Proceed to Checkout
                </Button>
              </Link>

              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-400">
                <Shield className="h-3.5 w-3.5" />
                Secure checkout with SSL encryption
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-5">You Might Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { title: "God of War Ragnarök", price: 7500, img: 'https://via.placeholder.com/200x200/1e3a8a/93c5fd?text=God+of+War' },
              { title: "Mortal Kombat 1", price: 6800, img: 'https://via.placeholder.com/200x200/7f1d1d/fca5a5?text=MK1' },
              { title: "FIFA 25 PS5", price: 6500, img: 'https://via.placeholder.com/200x200/052e16/86efac?text=FC25' },
              { title: "Resident Evil 4", price: 5500, img: 'https://via.placeholder.com/200x200/111827/d1d5db?text=RE4' },
            ].map((rec) => (
              <div key={rec.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <img src={rec.img} alt={rec.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">{rec.title}</h3>
                <p className="text-red-600 font-bold text-sm mb-2">{formatPrice(rec.price)}</p>
                <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-xs">Add to Cart</Button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
