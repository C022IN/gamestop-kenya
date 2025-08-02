'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, CreditCard, Smartphone } from 'lucide-react';

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart, itemCount } = useCart();
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });

  const formatPrice = (price: number) => {
    // Convert KES to USD (approximate rate: 1 USD = 150 KES)
    const convertedPrice = currency.code === 'USD' ? price / 150 : price;
    return `${currency.symbol}${Math.round(convertedPrice).toLocaleString()}`;
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const shippingCost = total >= 5000 ? 0 : 500;
  const finalTotal = total + shippingCost;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingCart className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Continue Shopping</span>
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Shopping Cart ({itemCount} items)</h1>
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrency(prev =>
              prev.code === 'KES'
                ? { code: 'USD', symbol: '$' }
                : { code: 'KES', symbol: 'KSh' }
            )}
          >
            {currency.code}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Cart Items</h2>
                  <Button
                    variant="ghost"
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{item.platform}</p>
                        {item.isDigital && (
                          <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                            Digital Download
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="h-8 w-8"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="h-8 w-8"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-semibold text-lg text-red-600">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-gray-500">
                            {formatPrice(item.price)} each
                          </p>
                        )}
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>

                {shippingCost === 0 && (
                  <p className="text-sm text-green-600">
                    ✓ Free delivery in Nairobi for orders above KSh 5,000
                  </p>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Payment Methods</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <span className="text-sm">M-Pesa</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">Debit/Credit Card</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Link href="/checkout">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg font-semibold">
                  Proceed to Checkout
                </Button>
              </Link>

              {/* Security Notice */}
              <p className="text-xs text-gray-500 mt-4 text-center">
                🔒 Secure checkout with SSL encryption
              </p>
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* These would be dynamically loaded recommended products */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <img
                src="https://via.placeholder.com/200x200/dc2626/ffffff?text=Recommended+Game"
                alt="Recommended Game"
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
              <h3 className="font-semibold mb-2">God of War Ragnarök</h3>
              <p className="text-red-600 font-bold">{formatPrice(7500)}</p>
              <Button className="w-full mt-3 bg-red-600 hover:bg-red-700">
                Add to Cart
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
