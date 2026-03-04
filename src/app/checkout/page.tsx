'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, ArrowRight, Check, CreditCard, Smartphone, MapPin, User, Mail, Phone, Shield } from 'lucide-react';

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ShippingInfo {
  address: string;
  city: string;
  county: string;
  postalCode: string;
  instructions?: string;
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const toggleCurrency = () =>
    setCurrency(prev => prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' });

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    address: '',
    city: 'Nairobi',
    county: 'Nairobi',
    postalCode: '',
    instructions: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const shippingCost = total >= 5000 ? 0 : 500;
  const finalTotal = total + shippingCost;

  const formatPrice = (price: number) => {
    return `${currency.symbol}${Math.round(price).toLocaleString()}`;
  };

  const steps = [
    { number: 1, title: 'Customer Info', icon: User },
    { number: 2, title: 'Shipping', icon: MapPin },
    { number: 3, title: 'Payment', icon: CreditCard },
    { number: 4, title: 'Confirmation', icon: Check }
  ];

  const handleCustomerInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerInfo.firstName && customerInfo.lastName && customerInfo.email && customerInfo.phone) {
      setCurrentStep(2);
    }
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shippingInfo.address && shippingInfo.city) {
      setCurrentStep(3);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((paymentMethod === 'mpesa' && mpesaPhone) || paymentMethod === 'card') {
      setIsProcessing(true);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate order number
      const orderNum = 'GS' + Date.now().toString().slice(-6);
      setOrderNumber(orderNum);
      setOrderPlaced(true);
      setIsProcessing(false);
      setCurrentStep(4);

      // Clear cart after successful order
      setTimeout(() => {
        clearCart();
      }, 1000);
    }
  };

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currency={currency} onCurrencyToggle={toggleCurrency} />
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Add some items to your cart before checking out.</p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700">Continue Shopping</Button>
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/cart">
              <Button variant="ghost" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Cart</span>
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Checkout</h1>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.number ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.number ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {step.title}
                </span>
                {step.number < steps.length && (
                  <div className={`w-16 h-1 mx-4 ${
                    currentStep > step.number ? 'bg-red-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Step 1: Customer Information */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Customer Information</h2>
                  <form onSubmit={handleCustomerInfoSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerInfo.firstName}
                          onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerInfo.lastName}
                          onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="+254 7XX XXX XXX"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                      Continue to Shipping
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </form>
                </div>
              )}

              {/* Step 2: Shipping Information */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Shipping Information</h2>
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="123 Main Street, Apartment 4B"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <select
                          required
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="Nairobi">Nairobi</option>
                          <option value="Mombasa">Mombasa</option>
                          <option value="Kisumu">Kisumu</option>
                          <option value="Nakuru">Nakuru</option>
                          <option value="Eldoret">Eldoret</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          County
                        </label>
                        <select
                          value={shippingInfo.county}
                          onChange={(e) => setShippingInfo({...shippingInfo, county: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="Nairobi">Nairobi</option>
                          <option value="Mombasa">Mombasa</option>
                          <option value="Kisumu">Kisumu</option>
                          <option value="Nakuru">Nakuru</option>
                          <option value="Uasin Gishu">Uasin Gishu</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.postalCode}
                        onChange={(e) => setShippingInfo({...shippingInfo, postalCode: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="00100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Instructions (Optional)
                      </label>
                      <textarea
                        value={shippingInfo.instructions}
                        onChange={(e) => setShippingInfo({...shippingInfo, instructions: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={3}
                        placeholder="e.g., Leave at the gate, Call when you arrive"
                      />
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                        Continue to Payment
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Payment Method</h2>
                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    {/* Payment Method Selection */}
                    <div className="space-y-4">
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          paymentMethod === 'mpesa' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                        }`}
                        onClick={() => setPaymentMethod('mpesa')}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="mpesa"
                            checked={paymentMethod === 'mpesa'}
                            onChange={() => setPaymentMethod('mpesa')}
                            className="text-green-600"
                          />
                          <Smartphone className="h-6 w-6 text-green-600" />
                          <div>
                            <h3 className="font-semibold">M-Pesa</h3>
                            <p className="text-sm text-gray-600">Pay with your M-Pesa mobile money</p>
                          </div>
                        </div>

                        {paymentMethod === 'mpesa' && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              M-Pesa Phone Number *
                            </label>
                            <input
                              type="tel"
                              required
                              value={mpesaPhone}
                              onChange={(e) => setMpesaPhone(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="254 7XX XXX XXX"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              You will receive an M-Pesa prompt on this number
                            </p>
                          </div>
                        )}
                      </div>

                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={paymentMethod === 'card'}
                            onChange={() => setPaymentMethod('card')}
                            className="text-blue-600"
                          />
                          <CreditCard className="h-6 w-6 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">Debit/Credit Card</h3>
                            <p className="text-sm text-gray-600">Visa, Mastercard accepted</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Shield className="h-4 w-4" />
                        <span>Your payment information is secure and encrypted</span>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        className="flex-1"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            Complete Order {formatPrice(finalTotal)}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 4: Order Confirmation */}
              {currentStep === 4 && orderPlaced && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
                  <p className="text-gray-600 mb-6">
                    Thank you for your order. We'll send you an email confirmation shortly.
                  </p>

                  <div className="bg-gray-50 p-6 rounded-lg mb-8">
                    <h3 className="font-semibold mb-2">Order Details</h3>
                    <p className="text-sm text-gray-600 mb-1">Order Number: <span className="font-mono font-medium">{orderNumber}</span></p>
                    <p className="text-sm text-gray-600 mb-1">Total: {formatPrice(finalTotal)}</p>
                    <p className="text-sm text-gray-600">Payment Method: {paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card'}</p>
                  </div>

                  <div className="space-y-4">
                    <Link href="/">
                      <Button className="w-full bg-red-600 hover:bg-red-700">
                        Continue Shopping
                      </Button>
                    </Link>
                    <Link href="/orders">
                      <Button variant="outline" className="w-full">
                        Track Your Order
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-xl font-semibold mb-4">Order Summary</h3>

              {/* Items */}
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Customer Info Summary (when available) */}
              {customerInfo.firstName && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-2">Delivery Info</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{customerInfo.firstName} {customerInfo.lastName}</p>
                    {shippingInfo.address && (
                      <>
                        <p>{shippingInfo.address}</p>
                        <p>{shippingInfo.city}, {shippingInfo.county}</p>
                      </>
                    )}
                    <p>{customerInfo.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
