export type StorefrontKind = 'games' | 'gift-cards' | 'hardware';
export type StorefrontImageAspect = 'portrait' | 'card' | 'wide';
export type StorefrontImageFit = 'cover' | 'contain';

export interface StorefrontProduct {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  platform?: string;
  isDigital?: boolean;
  formatLabel?: string;
  rating?: number;
  inStock?: boolean;
  blurb?: string;
  variant?: string;
  details?: string[];
  imageAspect?: StorefrontImageAspect;
  imageFit?: StorefrontImageFit;
  imagePosition?: string;
}

export interface StorefrontShowcaseCard {
  id: string;
  title: string;
  label: string;
  image: string;
  href: string;
  blurb: string;
  imageAspect?: StorefrontImageAspect;
  imageFit?: StorefrontImageFit;
  imagePosition?: string;
}
