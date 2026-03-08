'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Smartphone,
  MapPin,
  User,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

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

type MpesaState =
  | { phase: 'idle' }
  | { phase: 'sending' }
  | { phase: 'waiting'; checkoutRequestId: string; customerMessage: string }
  | { phase: 'success'; receiptNumber: string; amount: number }
  | { phase: 'failed'; reason: string };

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const toggleCurrency = () =>
    setCurrency(prev =>
      prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' }
    );

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    address: '',
    city: 'Nairobi',
    county: 'Nairobi',
    postalCode: '',
    instructions: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaState, setMpesaState] = useState<MpesaState>({ phase: 'idle' });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shippingCost = total >= 5000 ? 0 : 500;
  const finalTotal = total + shippingCost;

  const formatPrice = (price: number) => {
    const converted = currency.code === 'USD' ? price / 150 : price;
    return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
  };

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const steps = [
    { number: 1, title: 'Customer Info', icon: User },
    { number: 2, title: 'Shipping', icon: MapPin },
    { number: 3, title: 'Payment', icon: CreditCard },
    { number: 4, title: 'Confirmation', icon: Check },
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

  /** Poll /api/mpesa/status every 5 seconds until confirmed or failed */
  const startPolling = (checkoutRequestId: string, orderNum: string) => {
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes at 5s intervals

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/mpesa/status?id=${checkoutRequestId}`);
        const data = await res.json();

        if (data.status === 'success') {
          clearInterval(pollRef.current!);
          setMpesaState({
            phase: 'success',
            receiptNumber: data.mpesaReceiptNumber ?? '',
            amount: data.amount ?? finalTotal,
          });
          setOrderNumber(orderNum);
          setOrderPlaced(true);
          setCurrentStep(4);
          setTimeout(() => clearCart(), 1000);
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current!);
          setMpesaState({
            phase: 'failed',
            reason: data.resultDesc ?? 'Payment was not completed. Please try again.',
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(pollRef.current!);
          setMpesaState({
            phase: 'failed',
            reason: 'Payment timed out. If you were charged, please contact support.',
          });
        }
      } catch {
        // Network error — keep polling
      }
    }, 5000);
  };

  const handleMpesaPayment = async () => {
    const phone = mpesaPhone || customerInfo.phone;
    if (!phone) return;

    setMpesaState({ phase: 'sending' });

    try {
      const orderNum = 'GS' + Date.now().toString().slice(-6);

      const res = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          amount: finalTotal,
          orderId: orderNum,
          description: `GameStop Kenya order ${orderNum}`,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setMpesaState({
          phase: 'failed',
          reason: data.error ?? 'Failed to send M-Pesa prompt. Please try again.',
        });
        return;
      }

      setMpesaState({
        phase: 'waiting',
        checkoutRequestId: data.checkoutRequestId,
        customerMessage: data.customerMessage ?? 'Check your phone for the M-Pesa prompt.',
      });

      startPolling(data.checkoutRequestId, orderNum);
    } catch {
      setMpesaState({
        phase: 'failed',
        reason: 'Network error. Please check your connection and try again.',
      });
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder — integrate a card gateway (e.g. Stripe, Flutterwave) here
    const orderNum = 'GS' + Date.now().toString().slice(-6);
    setOrderNumber(orderNum);
    setOrderPlaced(true);
    setCurrentStep(4);
    setTimeout(() => clearCart(), 1000);
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
        {/* Back link */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/cart">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-500">
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Button>
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        {/* Step Indicator */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      currentStep > step.number
                        ? 'bg-green-600 text-white'
                        : currentStep === step.number
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
                  </div>
                  <span
                    className={`hidden sm:block text-xs font-medium ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

              {/* Step 1: Customer Information */}
              {currentStep === 1 && (
                <form onSubmit={handleCustomerInfoSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold mb-1">Customer Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'First Name', key: 'firstName', type: 'text', placeholder: 'John' },
                      { label: 'Last Name', key: 'lastName', type: 'text', placeholder: 'Kamau' },
                    ].map(({ label, key, type, placeholder }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label} *</label>
                        <input
                          type={type}
                          required
                          placeholder={placeholder}
                          value={customerInfo[key as keyof CustomerInfo]}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, [key]: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0717 402 034"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Kenyan number — also used for M-Pesa if same</p>
                  </div>
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 py-5 font-bold rounded-xl">
                    Continue to Shipping <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              )}

              {/* Step 2: Shipping Information */}
              {currentStep === 2 && (
                <form onSubmit={handleShippingSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold mb-1">Shipping Information</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Westlands, ABC Place, 2nd Floor"
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <select
                        required
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                      >
                        <option value="Nairobi">Nairobi</option>
                        <option value="Mombasa">Mombasa</option>
                        <option value="Kisumu">Kisumu</option>
                        <option value="Nakuru">Nakuru</option>
                        <option value="Eldoret">Eldoret</option>
                        <option value="Thika">Thika</option>
                        <option value="Nyeri">Nyeri</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        placeholder="00100"
                        value={shippingInfo.postalCode}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g., Call when you arrive, leave at the gate"
                      value={shippingInfo.instructions}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, instructions: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1 rounded-xl">
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl font-bold">
                      Continue to Payment <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-1">Payment Method</h2>

                  {/* Method selector */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: 'green' },
                      { id: 'card', label: 'Debit / Credit Card', icon: CreditCard, color: 'blue' },
                    ].map(({ id, label, icon: Icon, color }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(id as 'mpesa' | 'card');
                          setMpesaState({ phase: 'idle' });
                        }}
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-colors text-left ${
                          paymentMethod === id
                            ? color === 'green'
                              ? 'border-green-500 bg-green-50'
                              : 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${color === 'green' ? 'text-green-600' : 'text-blue-600'}`} />
                        <span className="font-semibold text-sm">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* M-Pesa Flow */}
                  {paymentMethod === 'mpesa' && (
                    <div className="space-y-4">
                      {/* Idle / form */}
                      {(mpesaState.phase === 'idle' || mpesaState.phase === 'failed') && (
                        <>
                          {mpesaState.phase === 'failed' && (
                            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold text-red-800 text-sm">Payment failed</p>
                                <p className="text-red-700 text-xs mt-0.5">{mpesaState.reason}</p>
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              M-Pesa Phone Number *
                            </label>
                            <input
                              type="tel"
                              placeholder="0717 402 034"
                              value={mpesaPhone || customerInfo.phone}
                              onChange={(e) => setMpesaPhone(e.target.value)}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-sm"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              An STK push prompt will be sent to this number — enter your M-Pesa PIN to confirm.
                            </p>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                            <p className="font-semibold mb-1">How it works:</p>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                              <li>Click "Pay with M-Pesa" below</li>
                              <li>A pop-up appears on your phone</li>
                              <li>Enter your M-Pesa PIN to confirm</li>
                              <li>Payment is confirmed instantly</li>
                            </ol>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setCurrentStep(2)}
                              className="flex-1 rounded-xl"
                            >
                              <ArrowLeft className="h-4 w-4 mr-2" /> Back
                            </Button>
                            <Button
                              type="button"
                              onClick={handleMpesaPayment}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-xl"
                            >
                              <Smartphone className="h-4 w-4 mr-2" />
                              Pay {formatPrice(finalTotal)} with M-Pesa
                            </Button>
                          </div>
                        </>
                      )}

                      {/* Sending STK push */}
                      {mpesaState.phase === 'sending' && (
                        <div className="text-center py-10">
                          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
                          <p className="font-semibold text-gray-800">Sending M-Pesa prompt…</p>
                          <p className="text-gray-500 text-sm mt-1">Please wait a moment.</p>
                        </div>
                      )}

                      {/* Waiting for PIN */}
                      {mpesaState.phase === 'waiting' && (
                        <div className="text-center py-8 space-y-4">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <Smartphone className="h-8 w-8 text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">Check your phone!</p>
                            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                              {mpesaState.customerMessage}
                            </p>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 text-left max-w-xs mx-auto">
                            <p className="font-semibold mb-2">Enter your M-Pesa PIN to pay:</p>
                            <p className="text-xl font-black text-green-700">{formatPrice(finalTotal)}</p>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Waiting for confirmation…
                          </div>
                          <button
                            type="button"
                            onClick={() => setMpesaState({ phase: 'idle' })}
                            className="text-xs text-gray-400 hover:text-red-500 underline"
                          >
                            Cancel and try again
                          </button>
                        </div>
                      )}

                      {/* Success — handled by moving to step 4 */}
                    </div>
                  )}

                  {/* Card Payment (placeholder) */}
                  {paymentMethod === 'card' && (
                    <form onSubmit={handleCardPayment} className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Card payments are processed securely. We accept Visa and Mastercard.</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                          <input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                            <input
                              type="text"
                              placeholder="MM / YY"
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                            <input
                              type="text"
                              placeholder="123"
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="flex-1 rounded-xl">
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold py-5 rounded-xl">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay {formatPrice(finalTotal)}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Security notice */}
                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
                    <Shield className="h-3.5 w-3.5" />
                    Secure 256-bit SSL encrypted checkout
                  </div>
                </div>
              )}

              {/* Step 4: Order Confirmation */}
              {currentStep === 4 && orderPlaced && (
                <div className="text-center py-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h2>
                  <p className="text-gray-500 mb-6">
                    Thank you for your order. We'll contact you on {customerInfo.phone} to confirm delivery.
                  </p>

                  <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Order Number</span>
                      <span className="font-mono font-bold">{orderNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount Paid</span>
                      <span className="font-bold text-green-600">{formatPrice(finalTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Payment Method</span>
                      <span className="font-medium">{paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card'}</span>
                    </div>
                    {paymentMethod === 'mpesa' && mpesaState.phase === 'success' && mpesaState.receiptNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">M-Pesa Receipt</span>
                        <span className="font-mono font-bold text-green-700">{mpesaState.receiptNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Delivery to</span>
                      <span className="font-medium">{shippingInfo.city}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link href="/">
                      <Button className="w-full bg-red-600 hover:bg-red-700 font-bold rounded-xl">Continue Shopping</Button>
                    </Link>
                    <Link href="/orders">
                      <Button variant="outline" className="w-full rounded-xl">Track Your Order</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
              <h3 className="font-bold text-base mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4 max-h-56 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.image} alt={item.title} className="w-11 h-11 object-cover rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? <span className="text-green-600 font-medium">FREE</span> : formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
                  <span>Total</span>
                  <span className="text-red-600">{formatPrice(finalTotal)}</span>
                </div>
              </div>
              {customerInfo.firstName && (
                <div className="border-t border-gray-100 mt-4 pt-4 text-xs text-gray-500 space-y-1">
                  <p className="font-semibold text-gray-700">Delivering to:</p>
                  <p>{customerInfo.firstName} {customerInfo.lastName}</p>
                  {shippingInfo.address && <p>{shippingInfo.address}, {shippingInfo.city}</p>}
                  <p>{customerInfo.phone}</p>
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
