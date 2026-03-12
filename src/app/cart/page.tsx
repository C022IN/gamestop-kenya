'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getCartPricing, getPromoDetails, normalizePromoCode } from '@/lib/cart-pricing';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  CreditCard,
  Smartphone,
  Shield,
  Tag,
} from 'lucide-react';

const recommendedProducts = [
  {
    title: 'God of War Ragnarok',
    price: 7500,
    img: '/images/games/god-of-war-ragnarok.svg',
    platform: 'PS5',
  },
  {
    title: 'Mortal Kombat 1',
    price: 6800,
    img: '/images/games/mortal-kombat-1.svg',
    platform: 'PlayStation',
  },
  {
    title: 'EA FC 25',
    price: 6500,
    img: '/images/games/ea-fc-25.svg',
    platform: 'PS5',
  },
  {
    title: 'Resident Evil 4',
    price: 5500,
    img: '/images/games/resident-evil-4.svg',
    platform: 'PlayStation',
  },
];

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
    promoCode,
    applyPromo,
    clearPromo,
    addItem,
  } = useCart();
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const [promoInput, setPromoInput] = useState(promoCode ?? '');
  const [promoFeedback, setPromoFeedback] = useState('');

  const toggleCurrency = () =>
    setCurrency((prev) =>
      prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' }
    );

  useEffect(() => {
    setPromoInput(promoCode ?? '');
  }, [promoCode]);

  const formatPrice = (price: number) => {
    const converted = currency.code === 'USD' ? price / 150 : price;
    return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
  };

  const handleQuantityChange = (id: string, qty: number) => {
    if (qty < 1) removeItem(id);
    else updateQuantity(id, qty);
  };

  const {
    subtotal,
    discount,
    shippingCost,
    finalTotal,
    remainingForFreeShipping,
    digitalOnly,
    appliedPromo,
  } = getCartPricing(items, promoCode);

  const handleApplyPromo = () => {
    const normalizedPromo = normalizePromoCode(promoInput);
    const promo = getPromoDetails(normalizedPromo);

    if (!promo) {
      setPromoFeedback('Promo code not recognized.');
      return;
    }

    applyPromo(normalizedPromo);
    setPromoFeedback(`${promo.code} applied. ${promo.label}.`);
  };

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
            <p className="text-gray-500 mb-8">
              Looks like you have not added anything yet. Start browsing our collection.
            </p>
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
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <span className="text-gray-400 text-sm">
            ({itemCount} item{itemCount !== 1 ? 's' : ''})
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
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
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {item.platform}
                          </span>
                          {item.isDigital && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
                              Digital
                            </span>
                          )}
                          {item.variant && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                              {item.variant}
                            </span>
                          )}
                        </div>
                        {item.details && item.details.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.details.slice(0, 2).map((detail) => (
                              <p key={detail} className="text-xs text-gray-500">
                                {detail}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <p className="font-bold text-red-600">
                          {formatPrice(item.price * item.quantity)}
                        </p>
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
                            <span className="px-3 py-1.5 text-sm font-medium min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-sm">Promo Code</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(event) => {
                    setPromoInput(event.target.value.toUpperCase());
                    setPromoFeedback('');
                  }}
                  placeholder="Enter promo code"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
                />
                <Button
                  onClick={handleApplyPromo}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold"
                >
                  Apply
                </Button>
                {promoCode && (
                  <Button
                    onClick={() => {
                      clearPromo();
                      setPromoInput('');
                      setPromoFeedback('Promo code removed.');
                    }}
                    variant="ghost"
                    className="rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  >
                    Remove
                  </Button>
                )}
              </div>
              {appliedPromo && (
                <p className="text-green-600 text-xs mt-2 font-medium">
                  {appliedPromo.code} active. {appliedPromo.label}.
                </p>
              )}
              {!appliedPromo && promoFeedback && (
                <p className="text-red-600 text-xs mt-2 font-medium">{promoFeedback}</p>
              )}
              {appliedPromo && promoFeedback && (
                <p className="text-gray-500 text-xs mt-2 font-medium">{promoFeedback}</p>
              )}
              <p className="text-gray-400 text-xs mt-2">Try: GAMESTOP10 for 10% off</p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-5">Order Summary</h2>
              <div className="space-y-3 text-sm mb-5">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Promo Discount</span>
                    <span>- {formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>{digitalOnly ? 'Digital Delivery' : 'Shipping'}</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                {!digitalOnly && shippingCost > 0 && (
                  <p className="text-xs text-gray-400">
                    Add {formatPrice(remainingForFreeShipping)} more for free delivery
                  </p>
                )}
                {digitalOnly && (
                  <p className="text-xs text-emerald-600">
                    Digital gift card orders skip shipping and stay payment-ready.
                  </p>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                  <span>Estimated Total</span>
                  <span className="text-red-600">{formatPrice(finalTotal)}</span>
                </div>
              </div>
              <p className="mb-5 text-xs text-gray-400">
                VAT and sales tax are calculated in Stripe Checkout for card orders based on billing or shipping country.
              </p>

              <div className="mb-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">
                  Pay with
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { icon: Smartphone, label: 'M-Pesa', color: 'text-green-600 bg-green-50' },
                    { icon: CreditCard, label: 'Stripe', color: 'text-slate-700 bg-slate-100' },
                    { icon: CreditCard, label: 'Visa', color: 'text-blue-600 bg-blue-50' },
                    {
                      icon: CreditCard,
                      label: 'Mastercard',
                      color: 'text-red-600 bg-red-50',
                    },
                  ].map(({ icon: Icon, label, color }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${color}`}
                    >
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

        <section className="mt-10">
          <h2 className="text-xl font-bold mb-5">You Might Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recommendedProducts.map((rec) => (
              <div
                key={rec.title}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                <img src={rec.img} alt={rec.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">{rec.title}</h3>
                <p className="text-red-600 font-bold text-sm mb-2">{formatPrice(rec.price)}</p>
                <Button
                  size="sm"
                  className="w-full bg-red-600 hover:bg-red-700 text-xs"
                  onClick={() =>
                    addItem({
                      id: `recommended-${rec.title.toLowerCase().replace(/\s+/g, '-')}`,
                      title: rec.title,
                      image: rec.img,
                      price: rec.price,
                      platform: rec.platform,
                    })
                  }
                >
                  Add to Cart
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
