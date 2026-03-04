'use client';

import { ShoppingCart, Heart, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

interface Product {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  platform?: string;
  isDigital?: boolean;
  rating?: number;
  inStock?: boolean;
}

interface ProductCardProps {
  product: Product;
  currency: { code: string; symbol: string };
}

export default function ProductCard({ product, currency }: ProductCardProps) {
  const { addItem } = useCart();
  const rating = product.rating ?? 0;
  const isInStock = product.inStock ?? true;
  const hasDiscount =
    typeof product.originalPrice === 'number' && product.originalPrice > product.price;
  const savingsRate = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      title: product.title,
      image: product.image,
      price: product.price,
      platform: product.platform || 'PC',
      isDigital: product.isDigital,
    });
  };

  const formatPrice = (price: number) => {
    const convertedPrice = currency.code === 'USD' ? price / 150 : price;
    return `${currency.symbol}${Math.round(convertedPrice).toLocaleString()}`;
  };

  const getPlatformColor = (platform?: string) => {
    switch (platform?.toLowerCase()) {
      case 'playstation':
      case 'ps5':
      case 'ps4':
        return 'bg-blue-600/95 ring-blue-300/70';
      case 'xbox':
        return 'bg-emerald-600/95 ring-emerald-300/70';
      case 'nintendo':
      case 'switch':
        return 'bg-red-600/95 ring-red-300/70';
      case 'pc':
        return 'bg-slate-700/95 ring-slate-300/60';
      default:
        return 'bg-gray-600/95 ring-gray-300/70';
    }
  };

  return (
    <article className="lux-card group flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="lux-media relative rounded-t-2xl">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

        {product.platform && (
          <div
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ${getPlatformColor(product.platform)}`}
          >
            {product.platform}
          </div>
        )}

        {product.isDigital && (
          <div className="absolute right-3 top-3 rounded-full bg-violet-600/95 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-violet-300/70">
            DIGITAL
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-white/85 text-gray-700 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
        >
          <Heart className="h-4 w-4" />
        </Button>

        {!isInStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="font-semibold text-white">OUT OF STOCK</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-gray-900">
          {product.title}
        </h3>

        {rating > 0 && (
          <div className="mb-3 flex items-center">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < Math.floor(rating) ? 'fill-current text-amber-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-1 text-xs font-medium text-gray-500">
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-red-600">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice!)}
              </span>
            )}
          </div>

          {hasDiscount && (
            <div className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-100">
              SAVE {savingsRate}%
            </div>
          )}
        </div>

        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          {isInStock ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>In stock and ready to dispatch</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>Backorder available on request</span>
            </>
          )}
        </div>

        <Button
          className="mt-auto w-full bg-red-600 font-semibold hover:bg-red-700"
          disabled={!isInStock}
          onClick={handleAddToCart}
        >
          {isInStock ? (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </>
          ) : (
            'Notify When Available'
          )}
        </Button>
      </div>
    </article>
  );
}
