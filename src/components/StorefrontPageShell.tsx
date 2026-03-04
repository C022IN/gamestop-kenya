'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface StorefrontPageShellProps {
  children: React.ReactNode;
}

export default function StorefrontPageShell({ children }: StorefrontPageShellProps) {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });

  const toggleCurrency = () => {
    setCurrency((prev) =>
      prev.code === 'KES'
        ? { code: 'USD', symbol: '$' }
        : { code: 'KES', symbol: 'KSh' }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />
      {children}
      <Footer />
    </div>
  );
}
