import type { StorefrontProduct, StorefrontShowcaseCard } from '@/lib/storefront-types';

export interface GameCatalogProduct extends StorefrontProduct {
  genre: string;
  category: 'story' | 'sports' | 'fighters' | 'family' | 'racing' | 'pre-owned';
  conditionLabel?: 'New' | 'Pre-Owned';
}

// Prices reflect current USD source pricing converted into the store's KES base.
export const gameCatalog: GameCatalogProduct[] = [
  {
    id: 'marvel-spiderman-2-ps5',
    title: "Marvel's Spider-Man 2 - PlayStation 5",
    image: '/images/games/spiderman-2.svg',
    price: 12700,
    platform: 'PS5',
    rating: 4.8,
    inStock: true,
    genre: 'Action Adventure',
    category: 'story',
    conditionLabel: 'New',
    blurb: 'Flagship single-player action with fast traversal, premium visuals, and high replay appeal.',
    imageAspect: 'portrait',
    imageFit: 'cover',
    imagePosition: 'center top',
  },
  {
    id: 'super-mario-bros-wonder-switch',
    title: 'Super Mario Bros. Wonder - Nintendo Switch',
    image: '/images/games/mario-wonder.svg',
    price: 11200,
    platform: 'Switch',
    rating: 4.9,
    inStock: true,
    genre: 'Platformer',
    category: 'family',
    conditionLabel: 'New',
    blurb: 'Bright, local-multiplayer-friendly Nintendo platforming built for shared sessions and quick joy.',
    imageAspect: 'portrait',
    imageFit: 'cover',
  },
  {
    id: 'forza-horizon-5-xbox',
    title: 'Forza Horizon 5 - Xbox Series X|S',
    image: '/images/games/forza-horizon-5.svg',
    price: 11200,
    platform: 'Xbox',
    rating: 4.7,
    inStock: true,
    genre: 'Racing',
    category: 'racing',
    conditionLabel: 'New',
    blurb: 'Open-world racing built for visual impact, social play, and long-session progression.',
    imageAspect: 'portrait',
    imageFit: 'cover',
  },
  {
    id: 'cyberpunk-2077-ultimate-pc',
    title: 'Cyberpunk 2077 Ultimate Edition - PC',
    image: '/images/games/cyberpunk-2077.svg',
    price: 14200,
    platform: 'PC',
    rating: 4.5,
    inStock: true,
    genre: 'Action RPG',
    category: 'story',
    conditionLabel: 'New',
    blurb: 'High-density open-world RPG for players chasing story depth, style, and hardware flex.',
    imageAspect: 'portrait',
    imageFit: 'cover',
  },
  {
    id: 'god-of-war-ragnarok-ps5',
    title: 'God of War Ragnarok - PS5',
    image: '/images/games/god-of-war-ragnarok.svg',
    price: 6700,
    originalPrice: 12700,
    platform: 'PS5',
    rating: 4.9,
    inStock: true,
    genre: 'Action Adventure',
    category: 'story',
    conditionLabel: 'New',
    blurb: 'Prestige cinematic action with heavyweight combat and one of the strongest story campaigns on PS5.',
    imageAspect: 'portrait',
    imageFit: 'cover',
  },
  {
    id: 'hogwarts-legacy-xbox',
    title: 'Hogwarts Legacy - Xbox Series X|S',
    image: '/images/games/hogwarts-legacy.svg',
    price: 12700,
    platform: 'Xbox',
    rating: 4.6,
    inStock: true,
    genre: 'Action RPG',
    category: 'story',
    conditionLabel: 'New',
    blurb: 'Open-world fantasy exploration for players who want a slower, more immersive progression loop.',
    imageAspect: 'portrait',
    imageFit: 'cover',
  },
  {
    id: 'zelda-tears-of-the-kingdom-switch',
    title: 'Zelda: Tears of the Kingdom - Nintendo Switch',
    image: '/images/games/zelda-totk.svg',
    price: 12700,
    platform: 'Switch',
    rating: 4.9,
    inStock: true,
    genre: 'Adventure',
    category: 'story',
    conditionLabel: 'New',
    blurb: 'System-defining exploration and sandbox creativity for the strongest single-player Switch libraries.',
    imageAspect: 'portrait',
    imageFit: 'cover',
  },
  {
    id: 'ea-fc-25-ps5',
    title: 'EA FC 25 - PS5',
    image: '/images/games/ea-fc-25.svg',
    price: 12700,
    platform: 'PS5',
    rating: 4.3,
    inStock: true,
    genre: 'Sports',
    category: 'sports',
    conditionLabel: 'New',
    blurb: 'Competitive football pick for weekend sessions, couch rivalries, and local tournament energy.',
    imageAspect: 'portrait',
    imageFit: 'cover',
  },
  {
    id: 'mortal-kombat-1-xbox',
    title: 'Mortal Kombat 1 - Xbox Series X|S',
    image: '/images/games/mortal-kombat-1.svg',
    price: 9700,
    platform: 'Xbox',
    rating: 4.4,
    inStock: true,
    genre: 'Fighting',
    category: 'fighters',
    conditionLabel: 'New',
    blurb: 'Tournament-ready fighter for players who want crisp mechanics, spectacle, and short competitive rounds.',
    imageAspect: 'portrait',
    imageFit: 'cover',
  },
  {
    id: 'resident-evil-4-ps5',
    title: 'Resident Evil 4 - PS5',
    image: '/images/games/resident-evil-4.svg',
    price: 5200,
    platform: 'PS5',
    rating: 4.7,
    inStock: true,
    genre: 'Survival Horror',
    category: 'story',
    conditionLabel: 'New',
    blurb: 'Refined survival-action pacing with premium remake polish and excellent moment-to-moment tension.',
    imageAspect: 'portrait',
    imageFit: 'cover',
  },
  {
    id: 'cyberpunk-2077-pre-owned-ps5',
    title: 'Cyberpunk 2077 - PS5 Pre-Owned',
    image: '/images/games/cyberpunk-2077.svg',
    price: 9700,
    platform: 'PS5',
    rating: 4.2,
    inStock: true,
    genre: 'Action RPG',
    category: 'pre-owned',
    conditionLabel: 'Pre-Owned',
    formatLabel: 'Pre-Owned',
    blurb: 'Lower-cost copy for players building a broader library without paying day-one pricing.',
    imageAspect: 'portrait',
    imageFit: 'cover',
  },
  {
    id: 'forza-horizon-5-pre-owned-xbox',
    title: 'Forza Horizon 5 - Xbox Pre-Owned',
    image: '/images/games/forza-horizon-5.svg',
    price: 10500,
    platform: 'Xbox',
    rating: 4.5,
    inStock: true,
    genre: 'Racing',
    category: 'pre-owned',
    conditionLabel: 'Pre-Owned',
    formatLabel: 'Pre-Owned',
    blurb: 'Value-focused racing pickup for players who want long playtime and lower entry cost.',
    imageAspect: 'portrait',
    imageFit: 'cover',
  },
];

export const featuredGameIds = [
  'marvel-spiderman-2-ps5',
  'super-mario-bros-wonder-switch',
  'forza-horizon-5-xbox',
  'cyberpunk-2077-ultimate-pc',
] as const;

export const flashDealGameIds = [
  'god-of-war-ragnarok-ps5',
  'hogwarts-legacy-xbox',
  'zelda-tears-of-the-kingdom-switch',
  'ea-fc-25-ps5',
] as const;

export const cartRecommendationIds = [
  'god-of-war-ragnarok-ps5',
  'mortal-kombat-1-xbox',
  'ea-fc-25-ps5',
  'resident-evil-4-ps5',
] as const;

function selectGameProducts(ids: readonly string[]) {
  return ids
    .map((id) => gameCatalog.find((product) => product.id === id))
    .filter(Boolean) as GameCatalogProduct[];
}

export function getFeaturedGames() {
  return selectGameProducts(featuredGameIds);
}

export function getFlashDeals() {
  return selectGameProducts(flashDealGameIds);
}

export function getCartRecommendations() {
  return selectGameProducts(cartRecommendationIds);
}

export function getGameCatalogByPlatform(platform: string) {
  return gameCatalog.filter((product) => product.platform?.toLowerCase() === platform.toLowerCase());
}

export function getGameCatalogByCategory(category: GameCatalogProduct['category']) {
  return gameCatalog.filter((product) => product.category === category);
}

export function getShowcaseCardsByIds(ids: readonly string[], hrefBase = '/games'): StorefrontShowcaseCard[] {
  return ids
    .map((id) => gameCatalog.find((product) => product.id === id))
    .filter((product): product is GameCatalogProduct => Boolean(product))
    .map((product) => ({
      id: product.id,
      title: product.title,
      label: `${product.platform} | ${product.genre}`,
      image: product.image,
      href: `${hrefBase}#${product.id}`,
      blurb: product.blurb ?? `${product.genre} pick for ${product.platform}.`,
      imageAspect: product.imageAspect,
      imageFit: product.imageFit,
      imagePosition: product.imagePosition,
    })) as StorefrontShowcaseCard[];
}
