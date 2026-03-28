'use client';

import type { ReactNode } from 'react';
import { CartProvider } from '@/domains/storefront/cart/CartContext';

export default function StorefrontProviders({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
