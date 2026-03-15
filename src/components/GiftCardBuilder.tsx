'use client';

import { useState } from 'react';
import { Gift, Mail, MessageSquareText, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

const presetAmounts = [1000, 2500, 5000, 10000];

const cardDesigns = [
  { id: 'classic-red', name: 'Classic Red', accent: 'from-red-700 via-red-600 to-amber-500' },
  { id: 'midnight-black', name: 'Midnight Black', accent: 'from-slate-950 via-slate-800 to-red-700' },
  { id: 'neon-green', name: 'Neon Green', accent: 'from-emerald-700 via-lime-500 to-green-300' },
  { id: 'royal-blue', name: 'Royal Blue', accent: 'from-blue-700 via-sky-500 to-cyan-300' },
];

interface GiftCardBuilderProps {
  currency: { code: string; symbol: string };
}

export default function GiftCardBuilder({ currency }: GiftCardBuilderProps) {
  const { addItem } = useCart();
  const [selectedFormat, setSelectedFormat] = useState<'digital' | 'physical'>('digital');
  const [selectedAmount, setSelectedAmount] = useState(2500);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedDesign, setSelectedDesign] = useState(cardDesigns[0].id);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const activeDesign = cardDesigns.find((design) => design.id === selectedDesign) ?? cardDesigns[0];

  const activeAmount = customAmount ? Number(customAmount) : selectedAmount;

  const formatPrice = (price: number) => {
    const convertedPrice = currency.code === 'USD' ? price / 150 : price;
    return `${currency.symbol}${Math.round(convertedPrice).toLocaleString()}`;
  };

  const handleAddToCart = () => {
    if (!activeAmount || Number.isNaN(activeAmount) || activeAmount < 500) {
      return;
    }

    const formatLabel = selectedFormat === 'digital' ? 'Digital delivery' : 'Physical card';
    const designName = cardDesigns.find((design) => design.id === selectedDesign)?.name ?? 'Classic Red';

    addItem({
      id: `builder-gift-card-${selectedFormat}-${selectedDesign}-${activeAmount}-${recipientEmail || recipientName || 'guest'}`,
      title: 'GameStop Kenya Gift Card',
      image: '/images/digital/gamestop-card.svg',
      price: activeAmount,
      platform: 'Universal',
      isDigital: selectedFormat === 'digital',
      variant: `${formatLabel} | ${designName}`,
      details: [
        recipientName ? `Recipient: ${recipientName}` : 'Recipient: to be confirmed',
        senderName ? `From: ${senderName}` : 'From: GameStop Kenya customer',
        ...(selectedFormat === 'digital' && recipientEmail ? [`Email: ${recipientEmail}`] : []),
        ...(message ? [`Message: ${message.slice(0, 80)}`] : []),
      ],
    });
  };

  return (
    <section
      id="gamestop-kenya-gift-card"
      className="lux-card overflow-hidden rounded-[2rem] border border-gray-200 bg-white"
    >
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="bg-gradient-to-br from-gray-950 via-red-950 to-gray-950 p-8 text-white md:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-100">
            <Sparkles className="h-3.5 w-3.5" />
            Custom Store Card
          </div>
          <h2 className="max-w-xl text-3xl font-black leading-tight md:text-4xl">
            Build a GameStop Kenya gift card.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-red-100/90 md:text-base">
            Choose the format, amount, and design.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Mail className="mb-2 h-5 w-5 text-red-200" />
              <p className="text-sm font-semibold">Digital Delivery</p>
              <p className="mt-1 text-xs text-red-100/80">Sent after payment.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Package className="mb-2 h-5 w-5 text-red-200" />
              <p className="text-sm font-semibold">Physical Card</p>
              <p className="mt-1 text-xs text-red-100/80">For handoff or delivery.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <MessageSquareText className="mb-2 h-5 w-5 text-red-200" />
              <p className="text-sm font-semibold">Gift Message</p>
              <p className="mt-1 text-xs text-red-100/80">Add a short note.</p>
            </div>
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-black/20 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-200">Preview</p>
            <div className={`mt-4 overflow-hidden rounded-[1.6rem] border border-white/10 bg-gradient-to-br ${activeDesign.accent} p-5 shadow-[0_22px_48px_rgba(0,0,0,0.3)]`}>
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <span>GameStop Kenya</span>
                <span>{selectedFormat === 'digital' ? 'Digital' : 'Physical'}</span>
              </div>
              <p className="mt-8 text-3xl font-black text-white md:text-4xl">{formatPrice(activeAmount || 0)}</p>
              <p className="mt-2 text-sm text-white/80">
                {recipientName ? `For ${recipientName}` : 'Gift ready'}
              </p>
              <div className="mt-10 rounded-2xl border border-white/15 bg-black/20 p-4 text-sm text-white/90">
                <p className="font-semibold">{senderName ? `From ${senderName}` : 'From GameStop Kenya customer'}</p>
                <p className="mt-2 line-clamp-2 text-white/70">
                  {message || 'Add a note.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Delivery</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    id: 'digital',
                    label: 'Digital',
                    description: 'Sent by email after payment.',
                    icon: Mail,
                  },
                  {
                    id: 'physical',
                    label: 'Physical',
                    description: 'For handoff or delivery.',
                    icon: Gift,
                  },
                ].map(({ id, label, description, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedFormat(id as 'digital' | 'physical')}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      selectedFormat === id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`mb-2 h-5 w-5 ${selectedFormat === id ? 'text-red-600' : 'text-gray-500'}`} />
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Select amount</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount('');
                    }}
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
                      !customAmount && selectedAmount === amount
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {formatPrice(amount)}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">
                  Custom amount
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={customAmount}
                  onChange={(event) => setCustomAmount(event.target.value)}
                  placeholder="Minimum KSh 500"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Pick a card design</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {cardDesigns.map((design) => (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => setSelectedDesign(design.id)}
                    className={`overflow-hidden rounded-2xl border text-left transition-colors ${
                      selectedDesign === design.id
                        ? 'border-red-500 ring-2 ring-red-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`h-24 bg-gradient-to-br ${design.accent}`} />
                    <div className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{design.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Recipient name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  placeholder="Who is this for?"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Recipient email (optional)
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">From</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(event) => setSenderName(event.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Gift message</label>
                <textarea
                  rows={3}
                  maxLength={160}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Add a short note for the recipient"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Ready to add</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedFormat === 'digital'
                      ? 'Sent by email after payment.'
                      : 'Ships with the rest of your order.'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Amount</p>
                  <p className="text-xl font-black text-red-600">{formatPrice(activeAmount || 0)}</p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAddToCart}
              className="w-full rounded-xl bg-red-600 py-5 font-bold hover:bg-red-700"
            >
              Add Gift Card To Cart
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
