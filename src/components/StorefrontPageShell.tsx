'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useStoreCurrency } from '@/hooks/useStoreCurrency';

interface StorefrontPageShellProps {
  children: React.ReactNode;
}

export default function StorefrontPageShell({ children }: StorefrontPageShellProps) {
  const { currency, toggleCurrency } = useStoreCurrency();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />
      {children}
      <Footer />
    </div>
  );
}
