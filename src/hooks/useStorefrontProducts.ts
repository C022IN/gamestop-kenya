'use client';

import { useEffect, useRef, useState } from 'react';
import type { StorefrontProduct } from '@/lib/storefront-types';

export function useStorefrontProducts<T extends StorefrontProduct>(
  kind: 'games' | 'gift-cards',
  fallbackProducts: T[]
) {
  const [products, setProducts] = useState<T[]>(fallbackProducts);
  const fallbackProductsRef = useRef(fallbackProducts);
  fallbackProductsRef.current = fallbackProducts;
  const fallbackIds = fallbackProducts.map((product) => product.id).join(',');
  const fallbackSignature = fallbackProducts
    .map((product) =>
      [
        product.id,
        product.image,
        product.price,
        product.originalPrice ?? '',
        product.platform ?? '',
        product.isDigital ? '1' : '0',
      ].join(':')
    )
    .join('|');

  useEffect(() => {
    setProducts(fallbackProductsRef.current);
  }, [fallbackSignature]);

  useEffect(() => {
    let cancelled = false;
    if (!fallbackIds) {
      setProducts(fallbackProductsRef.current);
      return undefined;
    }

    fetch(`/api/catalog/storefront?kind=${kind}&ids=${encodeURIComponent(fallbackIds)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.error || !Array.isArray(data.products)) {
          throw new Error(data.error ?? 'Could not load storefront media.');
        }

        if (!cancelled) {
          setProducts(data.products as T[]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts(fallbackProductsRef.current);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fallbackIds, fallbackSignature, kind]);

  return products;
}
