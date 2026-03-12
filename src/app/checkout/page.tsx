'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getCartPricing } from '@/lib/cart-pricing';
import {
  CHECKOUT_COUNTRIES,
  getCheckoutCountryLabel,
  isStateRequiredForCheckout,
} from '@/lib/checkout-countries';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Shield,
  Smartphone,
  User,
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
  state: string;
  country: string;
  postalCode: string;
  instructions: string;
}

interface DeliveryInfo {
  channel: 'email' | 'whatsapp';
  note: string;
}

interface StoreOrderSummary {
  id: string;
  orderNumber: string;
  customerInfo: CustomerInfo;
  shippingInfo?: ShippingInfo;
  deliveryInfo?: DeliveryInfo;
  subtotalKes: number;
  discountKes: number;
  shippingKes: number;
  taxKes: number;
  totalKes: number;
  digitalOnly: boolean;
  paymentProvider: 'stripe' | 'mpesa' | 'free';
  paymentStatus: 'pending' | 'paid' | 'free';
  paidAt?: string;
}

type MpesaState =
  | { phase: 'idle' }
  | { phase: 'sending' }
  | { phase: 'waiting'; checkoutRequestId: string; customerMessage: string }
  | { phase: 'success'; receiptNumber: string; amount: number }
  | { phase: 'failed'; reason: string };

export default function CheckoutPage() {
  const { items, clearCart, promoCode } = useCart();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    address: '',
    city: 'Nairobi',
    state: '',
    country: 'KE',
    postalCode: '',
    instructions: '',
  });
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    channel: 'email',
    note: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'stripe'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaState, setMpesaState] = useState<MpesaState>({ phase: 'idle' });
  const [stripeState, setStripeState] = useState<
    | { phase: 'idle' }
    | { phase: 'redirecting' }
    | { phase: 'verifying' }
    | { phase: 'failed'; reason: string }
  >({ phase: 'idle' });
  const [stripeOrder, setStripeOrder] = useState<StoreOrderSummary | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { subtotal, discount, shippingCost, finalTotal, digitalOnly, appliedPromo } = getCartPricing(
    items,
    promoCode
  );
  const canUseMpesa = digitalOnly || shippingInfo.country === 'KE';
  const shippingCountryLabel = getCheckoutCountryLabel(shippingInfo.country);
  const requiresShippingState = isStateRequiredForCheckout(shippingInfo.country);

  const steps = [
    { number: 1, title: 'Customer Info', icon: User },
    { number: 2, title: digitalOnly ? 'Delivery' : 'Shipping', icon: MapPin },
    { number: 3, title: 'Payment', icon: CreditCard },
    { number: 4, title: 'Confirmation', icon: Check },
  ];

  const toggleCurrency = () =>
    setCurrency((prev) =>
      prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' }
    );

  const formatPrice = (price: number) => {
    const converted = currency.code === 'USD' ? price / 150 : price;
    return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
  };

  const deliveryTarget = deliveryInfo.channel === 'email' ? customerInfo.email : customerInfo.phone;
  const confirmationOrder = stripeOrder;
  const confirmationDigitalOnly = confirmationOrder?.digitalOnly ?? digitalOnly;
  const confirmationCustomer = confirmationOrder?.customerInfo ?? customerInfo;
  const confirmationShipping = confirmationOrder?.shippingInfo ?? shippingInfo;
  const confirmationDelivery = confirmationOrder?.deliveryInfo ?? deliveryInfo;
  const confirmationTarget =
    confirmationDigitalOnly
      ? confirmationDelivery.channel === 'email'
        ? confirmationCustomer.email
        : confirmationCustomer.phone
      : confirmationCustomer.phone;
  const confirmationTax = confirmationOrder?.taxKes ?? 0;
  const confirmationTotal = confirmationOrder?.totalKes ?? finalTotal;
  const confirmationDiscount = confirmationOrder?.discountKes ?? discount;
  const confirmationPaymentLabel =
    confirmationOrder?.paymentProvider === 'free'
      ? 'Free Checkout'
      : confirmationOrder?.paymentProvider === 'mpesa' || paymentMethod === 'mpesa'
        ? 'M-Pesa'
        : 'Stripe';
  const stripeSessionId = searchParams.get('session_id');
  const stripeCanceled = searchParams.get('canceled');

  useEffect(() => {
    if (!canUseMpesa && paymentMethod === 'mpesa') {
      setPaymentMethod('stripe');
      setMpesaState({ phase: 'idle' });
    }
  }, [canUseMpesa, paymentMethod]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!stripeSessionId || stripeOrder || orderPlaced) return;

    let cancelled = false;
    setStripeState({ phase: 'verifying' });

    fetch(`/api/stripe/store/session?sessionId=${encodeURIComponent(stripeSessionId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error ?? 'Could not verify Stripe checkout.');
        }

        if (cancelled) return;

        setStripeOrder(data.order);
        setOrderNumber(data.order.orderNumber);
        setPaymentMethod(data.order.paymentProvider === 'mpesa' ? 'mpesa' : 'stripe');
        setOrderPlaced(true);
        setCurrentStep(4);
        setStripeState({ phase: 'idle' });
        setTimeout(() => clearCart(), 1000);
      })
      .catch((error) => {
        if (cancelled) return;
        setStripeState({
          phase: 'failed',
          reason: error instanceof Error ? error.message : 'Could not verify Stripe checkout.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [clearCart, orderPlaced, stripeOrder, stripeSessionId]);

  const startPolling = (checkoutRequestId: string) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/mpesa/status?id=${checkoutRequestId}`);
        const data = await response.json();

        if (data.status === 'success') {
          clearInterval(pollRef.current!);
          const confirmResponse = await fetch('/api/store/mpesa/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkoutRequestId }),
          });
          const confirmData = await confirmResponse.json();

          if (!confirmResponse.ok || confirmData.error) {
            setMpesaState({
              phase: 'failed',
              reason: confirmData.error ?? 'Payment was received, but the order could not be confirmed.',
            });
            return;
          }

          setMpesaState({
            phase: 'success',
            receiptNumber: confirmData.receiptNumber ?? data.mpesaReceiptNumber ?? '',
            amount: confirmData.amount ?? data.amount ?? finalTotal,
          });
          setStripeOrder(confirmData.order);
          setOrderNumber(confirmData.order.orderNumber);
          setOrderPlaced(true);
          setCurrentStep(4);
          setPaymentMethod('mpesa');
          setTimeout(() => clearCart(), 1000);
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current!);
          setMpesaState({
            phase: 'failed',
            reason: data.resultDesc ?? 'Payment was not completed. Please try again.',
          });
        } else if (attempts >= 24) {
          clearInterval(pollRef.current!);
          setMpesaState({
            phase: 'failed',
            reason: 'Payment timed out. If you were charged, please contact support.',
          });
        }
      } catch {
        // Keep polling on transient errors.
      }
    }, 5000);
  };

  const handleMpesaPayment = async () => {
    const phone = mpesaPhone || customerInfo.phone;
    if (!phone) return;

    setMpesaState({ phase: 'sending' });
    try {
      const response = await fetch('/api/store/mpesa/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerInfo,
          shippingInfo,
          deliveryInfo,
          promoCode,
          phone,
        }),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        setMpesaState({
          phase: 'failed',
          reason: data.error ?? 'Failed to send M-Pesa prompt. Please try again.',
        });
        return;
      }

      if (data.kind === 'free' && data.order) {
        setStripeOrder(data.order);
        setOrderNumber(data.order.orderNumber);
        setOrderPlaced(true);
        setCurrentStep(4);
        setMpesaState({ phase: 'idle' });
        setTimeout(() => clearCart(), 1000);
        return;
      }

      setMpesaState({
        phase: 'waiting',
        checkoutRequestId: data.checkoutRequestId,
        customerMessage: data.customerMessage ?? 'Check your phone for the M-Pesa prompt.',
      });
      setOrderNumber(data.orderNumber ?? '');
      startPolling(data.checkoutRequestId);
    } catch {
      setMpesaState({
        phase: 'failed',
        reason: 'Network error. Please check your connection and try again.',
      });
    }
  };

  const handleStripePayment = async () => {
    setStripeState({ phase: 'redirecting' });

    try {
      const response = await fetch('/api/stripe/store/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerInfo,
          shippingInfo,
          deliveryInfo,
          promoCode,
        }),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        setStripeState({
          phase: 'failed',
          reason: data.error ?? 'Could not start Stripe checkout.',
        });
        return;
      }

      if (data.kind === 'free' && data.order) {
        setStripeOrder(data.order);
        setOrderNumber(data.order.orderNumber);
        setPaymentMethod(data.order.paymentProvider === 'mpesa' ? 'mpesa' : 'stripe');
        setOrderPlaced(true);
        setCurrentStep(4);
        setStripeState({ phase: 'idle' });
        setTimeout(() => clearCart(), 1000);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setStripeState({
        phase: 'failed',
        reason: 'Stripe checkout did not return a redirect URL.',
      });
    } catch (error) {
      setStripeState({
        phase: 'failed',
        reason: error instanceof Error ? error.message : 'Could not start Stripe checkout.',
      });
    }
  };

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currency={currency} onCurrencyToggle={toggleCurrency} />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Add some items to your cart before checking out.</p>
          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-700">Continue Shopping</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (stripeSessionId && stripeState.phase === 'verifying' && !stripeOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currency={currency} onCurrencyToggle={toggleCurrency} />
        <div className="container mx-auto px-4 py-24 text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Verifying your Stripe checkout</h1>
          <p className="mt-2 text-gray-500">Please wait while we confirm your order.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />
      <div className="container mx-auto px-4 py-8">
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

        <div className="max-w-4xl mx-auto mb-8 flex items-center">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep > step.number
                      ? 'bg-green-600 text-white'
                      : currentStep === step.number
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
                </div>
                <span className={`hidden sm:block text-xs font-medium ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {currentStep === 1 && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (customerInfo.firstName && customerInfo.lastName && customerInfo.email && customerInfo.phone) {
                      setCurrentStep(2);
                    }
                  }}
                  className="space-y-5"
                >
                  <h2 className="text-xl font-bold">Customer Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'First Name', key: 'firstName', placeholder: 'John' },
                      { label: 'Last Name', key: 'lastName', placeholder: 'Kamau' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label} *</label>
                        <input
                          type="text"
                          required
                          placeholder={placeholder}
                          value={customerInfo[key as keyof CustomerInfo]}
                          onChange={(event) => setCustomerInfo({ ...customerInfo, [key]: event.target.value })}
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
                      onChange={(event) => setCustomerInfo({ ...customerInfo, email: event.target.value })}
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
                      onChange={(event) => setCustomerInfo({ ...customerInfo, phone: event.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 py-5 font-bold rounded-xl">
                    Continue to {digitalOnly ? 'Delivery' : 'Shipping'} <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              )}

              {currentStep === 2 && !digitalOnly && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (
                      shippingInfo.address &&
                      shippingInfo.city &&
                      shippingInfo.country &&
                      shippingInfo.postalCode &&
                      (!requiresShippingState || shippingInfo.state)
                    ) {
                      setCurrentStep(3);
                    }
                  }}
                  className="space-y-5"
                >
                  <h2 className="text-xl font-bold">Shipping Information</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Westlands, ABC Place, 2nd Floor"
                      value={shippingInfo.address}
                      onChange={(event) => setShippingInfo({ ...shippingInfo, address: event.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                      <select
                        required
                        value={shippingInfo.country}
                        onChange={(event) =>
                          setShippingInfo({ ...shippingInfo, country: event.target.value })
                        }
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                      >
                        {CHECKOUT_COUNTRIES.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nairobi"
                        value={shippingInfo.city}
                        onChange={(event) =>
                          setShippingInfo({ ...shippingInfo, city: event.target.value })
                        }
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State / Province / Region
                        {requiresShippingState ? ' *' : ''}
                      </label>
                      <input
                        type="text"
                        required={requiresShippingState}
                        placeholder={shippingInfo.country === 'US' ? 'California' : 'County / Region'}
                        value={shippingInfo.state}
                        onChange={(event) =>
                          setShippingInfo({ ...shippingInfo, state: event.target.value })
                        }
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="00100"
                        value={shippingInfo.postalCode}
                        onChange={(event) =>
                          setShippingInfo({ ...shippingInfo, postalCode: event.target.value })
                        }
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                    Stripe uses this destination plus the billing address you confirm later to calculate VAT and sales tax for supported countries, especially US and Europe.
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Delivery instructions"
                    value={shippingInfo.instructions}
                    onChange={(event) => setShippingInfo({ ...shippingInfo, instructions: event.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                  />
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

              {currentStep === 2 && digitalOnly && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setCurrentStep(3);
                  }}
                  className="space-y-5"
                >
                  <h2 className="text-xl font-bold">Digital Delivery</h2>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    No shipping address is required. Choose where your gift cards should be delivered after payment.
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { id: 'email', label: 'Email Delivery', value: customerInfo.email, icon: Mail },
                      { id: 'whatsapp', label: 'WhatsApp Delivery', value: customerInfo.phone, icon: Smartphone },
                    ].map(({ id, label, value, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setDeliveryInfo({ ...deliveryInfo, channel: id as 'email' | 'whatsapp' })}
                        className={`rounded-xl border p-4 text-left ${deliveryInfo.channel === id ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                      >
                        <Icon className={`mb-2 h-5 w-5 ${deliveryInfo.channel === id ? 'text-red-600' : 'text-gray-500'}`} />
                        <p className="text-sm font-semibold text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500 mt-1">{value}</p>
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Optional fulfillment note"
                    value={deliveryInfo.note}
                    onChange={(event) => setDeliveryInfo({ ...deliveryInfo, note: event.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm"
                  />
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    Delivery target: <span className="font-medium text-gray-900">{deliveryTarget}</span>
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

              {currentStep === 3 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold">Payment Method</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        id: 'mpesa',
                        label: 'M-Pesa',
                        icon: Smartphone,
                        active: 'border-green-500 bg-green-50 text-green-700',
                        disabled: !canUseMpesa,
                      },
                      { id: 'stripe', label: 'Stripe / Cards', icon: CreditCard, active: 'border-blue-500 bg-blue-50 text-blue-700' },
                    ].map(({ id, label, icon: Icon, active, disabled }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          if (disabled) return;
                          setPaymentMethod(id as 'mpesa' | 'stripe');
                          setMpesaState({ phase: 'idle' });
                          setStripeState({ phase: 'idle' });
                        }}
                        disabled={disabled}
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl text-left ${
                          disabled
                            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                            : paymentMethod === id
                              ? active
                              : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-semibold text-sm">
                          {label}
                          {disabled ? ' (Kenya only)' : ''}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    {digitalOnly
                      ? `After payment, your gift cards will be sent via ${deliveryInfo.channel === 'email' ? 'email' : 'WhatsApp'} to ${deliveryTarget}.`
                      : 'After payment, your order moves into delivery confirmation and dispatch.'}
                  </div>

                  {!canUseMpesa && !digitalOnly && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      International physical orders use Stripe Checkout so destination-based VAT and sales tax can be calculated correctly.
                    </div>
                  )}

                  {paymentMethod === 'mpesa' && (
                    <div className="space-y-4">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone Number *</label>
                            <input
                              type="tel"
                              placeholder="0717 402 034"
                              value={mpesaPhone || customerInfo.phone}
                              onChange={(event) => setMpesaPhone(event.target.value)}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-sm"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="flex-1 rounded-xl">
                              <ArrowLeft className="h-4 w-4 mr-2" /> Back
                            </Button>
                            <Button type="button" onClick={handleMpesaPayment} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-xl">
                              <Smartphone className="h-4 w-4 mr-2" />
                              Pay {formatPrice(finalTotal)} with M-Pesa
                            </Button>
                          </div>
                        </>
                      )}

                      {mpesaState.phase === 'sending' && (
                        <div className="text-center py-10">
                          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
                          <p className="font-semibold text-gray-800">Sending M-Pesa prompt...</p>
                        </div>
                      )}

                      {mpesaState.phase === 'waiting' && (
                        <div className="text-center py-8 space-y-4">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <Smartphone className="h-8 w-8 text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">Check your phone</p>
                            <p className="text-gray-500 text-sm mt-1">{mpesaState.customerMessage}</p>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Waiting for confirmation...
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'stripe' && (
                    <div className="space-y-4">
                      {(stripeCanceled || stripeState.phase === 'failed') && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>
                            {stripeState.phase === 'failed'
                              ? stripeState.reason
                              : 'Stripe checkout was canceled before payment completed.'}
                          </span>
                        </div>
                      )}
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                        Stripe hosts the card checkout for this order. Visa, Mastercard, Link, VAT ID capture, and jurisdiction-based tax calculation all run inside the same hosted flow.
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                        Taxes and VAT are calculated at checkout from the billing and shipping details you confirm there, so the final charged amount can be slightly higher than the pre-tax cart total shown here.
                      </div>
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="flex-1 rounded-xl">
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        <Button
                          type="button"
                          onClick={handleStripePayment}
                          disabled={stripeState.phase === 'redirecting' || stripeState.phase === 'verifying'}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold py-5 rounded-xl"
                        >
                          {stripeState.phase === 'redirecting' || stripeState.phase === 'verifying' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Preparing Stripe Checkout
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay {formatPrice(finalTotal)} with Stripe
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Shield className="h-3.5 w-3.5" />
                    Secure 256-bit SSL encrypted checkout
                  </div>
                </div>
              )}

              {currentStep === 4 && orderPlaced && (
                <div className="text-center py-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed</h2>
                  <p className="text-gray-500 mb-6">
                    {confirmationDigitalOnly
                      ? `Your gift cards will be delivered via ${confirmationDelivery.channel === 'email' ? 'email' : 'WhatsApp'} to ${confirmationTarget}.`
                      : `We will contact you on ${confirmationCustomer.phone} to confirm delivery.`}
                  </p>
                  <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Order Number</span><span className="font-mono font-bold">{confirmationOrder?.orderNumber ?? orderNumber}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Amount Paid</span><span className="font-bold text-green-600">{formatPrice(confirmationTotal)}</span></div>
                    {confirmationDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Promo Savings</span><span className="font-medium text-green-700">{formatPrice(confirmationDiscount)}</span></div>}
                    {confirmationTax > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Tax / VAT</span><span className="font-medium text-gray-900">{formatPrice(confirmationTax)}</span></div>}
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Payment Method</span><span className="font-medium">{confirmationPaymentLabel}</span></div>
                    {paymentMethod === 'mpesa' && mpesaState.phase === 'success' && mpesaState.receiptNumber && <div className="flex justify-between text-sm"><span className="text-gray-500">M-Pesa Receipt</span><span className="font-mono font-bold text-green-700">{mpesaState.receiptNumber}</span></div>}
                  </div>
                  <div className="space-y-3">
                    <Link href="/"><Button className="w-full bg-red-600 hover:bg-red-700 font-bold rounded-xl">Continue Shopping</Button></Link>
                    <Link href="/orders"><Button variant="outline" className="w-full rounded-xl">Track Your Order</Button></Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
              <h3 className="font-bold text-base mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <img src={item.image} alt={item.title} className="w-11 h-11 object-cover rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      {item.variant && <p className="text-xs text-amber-700 truncate">{item.variant}</p>}
                    </div>
                    <p className="text-xs font-bold shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                {discount > 0 && appliedPromo && <div className="flex justify-between text-green-600"><span>{appliedPromo.code}</span><span>- {formatPrice(discount)}</span></div>}
                <div className="flex justify-between text-gray-500"><span>{digitalOnly ? 'Digital Delivery' : 'Shipping'}</span><span>{shippingCost === 0 ? <span className="text-green-600 font-medium">FREE</span> : formatPrice(shippingCost)}</span></div>
                <div className="flex justify-between text-gray-500">
                  <span>Taxes / VAT</span>
                  <span className="text-right text-xs font-medium text-blue-600">
                    Calculated at secure checkout
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2"><span>Estimated Total</span><span className="text-red-600">{formatPrice(finalTotal)}</span></div>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Final tax depends on billing or shipping country. US and European VAT or sales-tax rules are applied in Stripe Checkout when you pay by card.
              </p>
              {customerInfo.firstName && (
                <div className="border-t border-gray-100 mt-4 pt-4 text-xs text-gray-500 space-y-1">
                  <p className="font-semibold text-gray-700">{digitalOnly ? 'Sending to:' : 'Delivering to:'}</p>
                  <p>{customerInfo.firstName} {customerInfo.lastName}</p>
                  {digitalOnly ? <p>{deliveryTarget}</p> : <>
                    {shippingInfo.address && <p>{shippingInfo.address}, {shippingInfo.city}</p>}
                    <p>{shippingCountryLabel}</p>
                    <p>{customerInfo.phone}</p>
                  </>}
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
