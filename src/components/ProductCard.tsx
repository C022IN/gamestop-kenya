'use client';

import { ShoppingCart, Heart, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import type { StorefrontProduct } from '@/lib/storefront-types';

interface ProductCardProps {
  product: StorefrontProduct;
  currency: { code: string; symbol: string };
}

function getPlatformSurface(product: StorefrontProduct) {
  const platform = product.platform?.toLowerCase();

  if (product.isDigital) {
    return 'from-slate-950 via-slate-900 to-gray-950';
  }

  switch (platform) {
    case 'playstation':
    case 'ps5':
    case 'ps4':
      return 'from-blue-950 via-blue-900 to-slate-950';
    case 'xbox':
      return 'from-emerald-950 via-emerald-900 to-slate-950';
    case 'nintendo':
    case 'switch':
      return 'from-red-950 via-red-900 to-slate-950';
    case 'pc':
      return 'from-slate-950 via-slate-800 to-zinc-900';
    default:
      return 'from-gray-950 via-gray-900 to-zinc-900';
  }
}

function getPlatformColor(platform?: string) {
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
}

export default function ProductCard({ product, currency }: ProductCardProps) {
  const { addItem } = useCart();
  const rating = product.rating ?? 0;
  const isInStock = product.inStock ?? true;
  const deliveryLabel = product.isDigital
    ? 'Digital delivery after payment'
    : 'In stock and ready to dispatch';
  const formatLabel = product.formatLabel ?? (product.isDigital ? 'Digital' : undefined);
  const hasDiscount =
    typeof product.originalPrice === 'number' && product.originalPrice > product.price;
  const savingsRate = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;
  const mediaAspect = product.imageAspect ?? (product.isDigital ? 'card' : 'portrait');
  const mediaFit = product.imageFit ?? (mediaAspect === 'card' ? 'contain' : 'cover');
  const isHardwareCard = mediaAspect === 'card' && !product.isDigital;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      title: product.title,
      image: product.image,
      price: product.price,
      platform: product.platform || 'PC',
      isDigital: product.isDigital,
      variant: product.variant ?? product.formatLabel,
      details: product.details ?? (product.blurb ? [product.blurb] : undefined),
    });
  };

  const formatPrice = (price: number) => {
    const convertedPrice = currency.code === 'USD' ? price / 150 : price;
    return `${currency.symbol}${Math.round(convertedPrice).toLocaleString()}`;
  };

  return (
    <article className="lux-card group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.08)]">
      <div className={`relative overflow-hidden bg-gradient-to-br ${getPlatformSurface(product)}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(248,250,252,0.12),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(248,113,113,0.2),_transparent_34%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/40 to-transparent" />

        {product.platform && (
          <div
            className={`absolute left-3 top-3 z-20 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ${getPlatformColor(product.platform)}`}
          >
            {product.platform}
          </div>
        )}

        {formatLabel && (
          <div
            className={`absolute right-3 top-3 z-20 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ${
              formatLabel.toLowerCase() === 'physical' || formatLabel.toLowerCase() === 'pre-owned'
                ? 'bg-amber-500/95 ring-amber-200/70'
                : 'bg-violet-600/95 ring-violet-300/70'
            }`}
          >
            {formatLabel.toUpperCase()}
          </div>
        )}

        <div className={`relative z-10 ${mediaAspect === 'card' ? 'p-5' : 'p-4'}`}>
          <div
            className={`mx-auto overflow-hidden rounded-[1.5rem] border shadow-[0_20px_48px_rgba(0,0,0,0.28)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.02] ${
              isHardwareCard
                ? 'border-slate-200/80 bg-white/95'
                : 'border-white/10 bg-black/20 backdrop-blur-sm'
            } ${
              mediaAspect === 'card'
                ? 'aspect-[16/10] w-full'
                : mediaAspect === 'wide'
                  ? 'aspect-[16/9] w-full'
                  : 'aspect-[4/5] w-[78%]'
            }`}
          >
            <div
              className={`relative h-full w-full overflow-hidden rounded-[1.35rem] ${
                isHardwareCard ? 'bg-white' : 'bg-white/5'
              }`}
            >
              <img
                src={product.image}
                alt={product.title}
                loading="lazy"
                style={{ objectPosition: product.imagePosition ?? 'center' }}
                className={`h-full w-full transition-transform duration-700 ${
                  mediaFit === 'contain'
                    ? `${isHardwareCard ? 'object-contain p-3' : 'object-contain p-4'} group-hover:scale-105`
                    : 'object-cover group-hover:scale-110'
                }`}
              />
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-3 right-3 z-20 h-9 w-9 rounded-full bg-white/85 text-gray-700 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
        >
          <Heart className="h-4 w-4" />
        </Button>

        {!isInStock && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
            <span className="font-semibold text-white">OUT OF STOCK</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-gray-900">
          {product.title}
        </h3>

        {product.blurb && (
          <p className="mb-3 line-clamp-2 text-xs leading-5 text-gray-500">{product.blurb}</p>
        )}

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
            <span className="ml-1 text-xs font-medium text-gray-500">{rating.toFixed(1)}</span>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-red-600">
              {formatPrice(product.price)}
            </span>
            {product.priceNote && (
              <span className="text-xs font-medium text-gray-500">{product.priceNote}</span>
            )}
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
              <span>{deliveryLabel}</span>
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
