'use client';

import { ShoppingCart, Heart } from 'lucide-react';
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

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      title: product.title,
      image: product.image,
      price: product.price,
      platform: product.platform || 'PC',
      isDigital: product.isDigital
    });
  };

  const formatPrice = (price: number) => {
    // Convert KES to USD (approximate rate: 1 USD = 150 KES)
    const convertedPrice = currency.code === 'USD' ? price / 150 : price;
    return `${currency.symbol}${Math.round(convertedPrice).toLocaleString()}`;
  };

  const getPlatformColor = (platform?: string) => {
    switch (platform?.toLowerCase()) {
      case 'playstation':
      case 'ps5':
      case 'ps4':
        return 'bg-blue-600';
      case 'xbox':
        return 'bg-green-600';
      case 'nintendo':
      case 'switch':
        return 'bg-red-600';
      case 'pc':
        return 'bg-gray-600';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 group">
      {/* Product Image */}
      <div className="relative overflow-hidden rounded-t-lg">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Platform badge */}
        {product.platform && (
          <div className={`absolute top-2 left-2 ${getPlatformColor(product.platform)} text-white px-2 py-1 rounded text-xs font-semibold`}>
            {product.platform}
          </div>
        )}

        {/* Digital badge */}
        {product.isDigital && (
          <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
            DIGITAL
          </div>
        )}

        {/* Wishlist button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="h-4 w-4" />
        </Button>

        {/* Stock status */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">OUT OF STOCK</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 h-10">
          {product.title}
        </h3>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.floor(product.rating!) ? 'text-yellow-400' : 'text-gray-300'}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-red-600">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {product.originalPrice && (
            <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
              SAVE {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </div>
          )}
        </div>

        {/* Add to Cart */}
        <Button
          className="w-full bg-red-600 hover:bg-red-700"
          disabled={!product.inStock}
          onClick={handleAddToCart}
        >
          {product.inStock ? (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </>
          ) : (
            'Notify When Available'
          )}
        </Button>
      </div>
    </div>
  );
}
