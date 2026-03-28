import type { ReactNode } from 'react';
import StorefrontProviders from '@/domains/storefront/providers/StorefrontProviders';

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return <StorefrontProviders>{children}</StorefrontProviders>;
}
