'use client';

import { useState } from 'react';

export interface StoreCurrency {
  code: 'KES' | 'USD';
  symbol: 'KSh' | '$';
}

const DEFAULT_CURRENCY: StoreCurrency = {
  code: 'KES',
  symbol: 'KSh',
};

export function useStoreCurrency(initialCurrency: StoreCurrency = DEFAULT_CURRENCY) {
  const [currency, setCurrency] = useState<StoreCurrency>(initialCurrency);

  const toggleCurrency = () => {
    setCurrency((prev) =>
      prev.code === 'KES'
        ? { code: 'USD', symbol: '$' }
        : DEFAULT_CURRENCY
    );
  };

  return {
    currency,
    setCurrency,
    toggleCurrency,
  };
}
