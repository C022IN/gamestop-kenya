import type { StorefrontProduct, StorefrontShowcaseCard } from '@/lib/storefront-types';

export type HardwareFamily = 'PlayStation' | 'Xbox' | 'Nintendo' | 'PC' | 'Universal';
export type HardwareDepartment =
  | 'console'
  | 'controller'
  | 'audio'
  | 'sim-racing'
  | 'pc-part'
  | 'peripheral';

export interface HardwareCatalogProduct extends StorefrontProduct {
  family: HardwareFamily;
  department: HardwareDepartment;
  compatibility: string[];
}

const unsplash = (slug: string, width = 1600) =>
  `https://unsplash.com/photos/${slug}/download?force=true&w=${width}&q=80`;

export const hardwareCatalog: HardwareCatalogProduct[] = [
  {
    id: 'ps5-console-slim',
    title: 'PlayStation 5 Slim Console',
    image: unsplash('a-playstation-5-console-with-its-controller--8xeF0LeUtI'),
    price: 76000,
    originalPrice: 82000,
    platform: 'PlayStation',
    rating: 4.9,
    inStock: true,
    family: 'PlayStation',
    department: 'console',
    compatibility: ['PS5', '4K TVs', 'DualSense ecosystem'],
    blurb: 'Premium next-gen console with fast SSD load times, strong exclusives, and a Kenya-friendly starter point for serious home gaming.',
    details: ['1TB storage', 'Disc edition available', 'Works with PS Plus and PSN top-ups'],
    imageAspect: 'card',
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: 'xbox-series-x-console',
    title: 'Xbox Series X Console',
    image: unsplash('black-xbox-one-console-with-controller-DPOdCl4bGJU'),
    price: 72000,
    originalPrice: 78000,
    platform: 'Xbox',
    rating: 4.8,
    inStock: true,
    family: 'Xbox',
    department: 'console',
    compatibility: ['Xbox Series X|S', 'Game Pass', '4K 120Hz displays'],
    blurb: 'A power-first Xbox option for high-frame-rate play, Game Pass libraries, and premium living-room setups.',
    details: ['1TB storage', 'Game Pass ready', 'Low-latency controller support'],
    imageAspect: 'card',
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: 'nintendo-switch-oled-console',
    title: 'Nintendo Switch OLED',
    image: unsplash('red-and-blue-nintendo-switch-jqpRECmiNEU'),
    price: 45500,
    originalPrice: 49000,
    platform: 'Nintendo',
    rating: 4.9,
    inStock: true,
    family: 'Nintendo',
    department: 'console',
    compatibility: ['Nintendo Switch', 'Docked mode', 'Joy-Con multiplayer'],
    blurb: 'Portable and dock-ready Nintendo hardware for family gaming, travel, and easy multiplayer sessions.',
    details: ['OLED display', 'Handheld + docked play', 'Works with eShop top-ups'],
    imageAspect: 'card',
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: 'rgb-gaming-pc-tower',
    title: 'Custom RGB Gaming PC',
    image: unsplash('custom-gaming-computer-with-rgb-lighting-QLQSgxQzzqg'),
    price: 168000,
    originalPrice: 182000,
    platform: 'PC',
    rating: 4.8,
    inStock: true,
    family: 'PC',
    department: 'console',
    compatibility: ['Steam', 'Epic Games', 'High-refresh monitors'],
    blurb: 'A desk-ready gaming PC build for players who want stronger graphics settings, streaming headroom, and serious upgrade paths.',
    details: ['RGB build', 'Upgradeable internals', 'Optimized for competitive and cinematic titles'],
    imageAspect: 'card',
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: 'dualsense-wireless-controller',
    title: 'DualSense Wireless Controller',
    image: unsplash('a-white-playstation-5-controller-sitting-on-top-of-a-red-table-cloth-VM6uuM6-0mA'),
    price: 11900,
    originalPrice: 13500,
    platform: 'PlayStation',
    rating: 4.8,
    inStock: true,
    family: 'PlayStation',
    department: 'controller',
    compatibility: ['PS5', 'PC USB-C play', 'Local multiplayer'],
    blurb: 'Add a second PS5 pad for couch play, charging rotation, or players who want the premium haptics experience.',
    details: ['Adaptive triggers', 'Built-in mic', 'USB-C charging'],
    imageAspect: 'card',
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: 'xbox-wireless-controller',
    title: 'Xbox Wireless Controller',
    image: unsplash('shallow-focus-photo-of-white-microsoft-xbox-wireless-game-controller-P5cIVQm6r3U'),
    price: 9800,
    originalPrice: 11200,
    platform: 'Xbox',
    rating: 4.7,
    inStock: true,
    family: 'Xbox',
    department: 'controller',
    compatibility: ['Xbox Series X|S', 'Windows PC', 'Cloud gaming'],
    blurb: 'Reliable controller pick for Xbox consoles and PC play, built for familiar ergonomics and broad compatibility.',
    details: ['Bluetooth support', 'Textured grips', 'Cross-platform pairing'],
    imageAspect: 'card',
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: 'switch-pro-controller',
    title: 'Nintendo Switch Pro Controller',
    image: unsplash('nintendo-switch-controller-DBFxpmpaocw'),
    price: 9200,
    originalPrice: 10200,
    platform: 'Nintendo',
    rating: 4.7,
    inStock: true,
    family: 'Nintendo',
    department: 'controller',
    compatibility: ['Nintendo Switch', 'Docked play', 'Local co-op'],
    blurb: 'A better long-session controller for Switch owners who want stronger comfort than Joy-Cons for serious play.',
    details: ['Wireless play', 'Long battery life', 'Better grip for TV sessions'],
    imageAspect: 'card',
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: 'wireless-gaming-headset',
    title: 'Wireless Gaming Headset',
    image: unsplash('black-corded-gaming-headset-beside-black-flat-screen-computer-monitor-turned-on-uwL_JvIhtLM'),
    price: 14800,
    originalPrice: 16900,
    platform: 'Universal',
    rating: 4.6,
    inStock: true,
    family: 'Universal',
    department: 'audio',
    compatibility: ['PlayStation', 'Xbox', 'Nintendo', 'PC'],
    blurb: 'Clear team chat, punchy audio, and longer-session comfort for shooters, football nights, and streaming setups.',
    details: ['Low-latency wireless', 'Fold-flat earcups', 'Detachable mic support'],
    imageAspect: 'card',
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: 'logitech-g923-racing-wheel',
    title: 'Racing Wheel And Pedals',
    image: unsplash('logitech-g-racing-wheel-and-pedals-in-box-C0LBG0JHB_8'),
    price: 49800,
    originalPrice: 54500,
    platform: 'Universal',
    rating: 4.8,
    inStock: true,
    family: 'Universal',
    department: 'sim-racing',
    compatibility: ['PlayStation', 'Xbox', 'PC'],
    blurb: 'A serious sim-racing upgrade for Forza, Gran Turismo, and F1 players who want more control than a thumbstick provides.',
    details: ['Wheel + pedals', 'Desk or rig mounting', 'Great for racing libraries'],
    imageAspect: 'card',
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: 'geforce-rtx-graphics-card',
    title: 'GeForce RTX Graphics Card',
    image: unsplash('a-high-performance-graphics-card-with-three-fans-bXSC9GGir_A'),
    price: 96500,
    originalPrice: 102000,
    platform: 'PC',
    rating: 4.9,
    inStock: true,
    family: 'PC',
    department: 'pc-part',
    compatibility: ['ATX builds', '1440p gaming', 'Ray tracing workloads'],
    blurb: 'A visual upgrade path for players moving into stronger PC graphics, smoother frame rates, and better streaming performance.',
    details: ['Triple-fan cooling', 'High-performance rendering', 'Built for modern AAA games'],
    imageAspect: 'card',
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: 'mechanical-gaming-keyboard',
    title: 'Mechanical Gaming Keyboard',
    image: unsplash('close-up-of-a-backlit-mechanical-keyboard-with-colorful-keys-OPeU3k7VwpY'),
    price: 8200,
    originalPrice: 9400,
    platform: 'PC',
    rating: 4.7,
    inStock: true,
    family: 'PC',
    department: 'peripheral',
    compatibility: ['PC', 'Streaming desks', 'Competitive shooters'],
    blurb: 'Responsive keys and stronger tactile feedback for players who want a cleaner input upgrade on PC setups.',
    details: ['RGB lighting', 'Mechanical switches', 'Compact desk-friendly layout'],
    imageAspect: 'card',
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: 'wireless-gaming-mouse',
    title: 'Wireless Gaming Mouse',
    image: unsplash('a-black-computer-mouse-ePGW9e_gcz8'),
    price: 5600,
    originalPrice: 6500,
    platform: 'PC',
    rating: 4.6,
    inStock: true,
    family: 'PC',
    department: 'peripheral',
    compatibility: ['PC', 'Laptop setups', 'Competitive games'],
    blurb: 'Fast-response mouse tuned for shooters, MOBAs, and clean desk setups where cable drag gets in the way.',
    details: ['Low-latency sensor', 'Lightweight shell', 'Rechargeable'],
    imageAspect: 'card',
    imageFit: 'cover',
    imagePosition: 'center',
  },
];

export const featuredConsoleIds = [
  'ps5-console-slim',
  'xbox-series-x-console',
  'nintendo-switch-oled-console',
  'rgb-gaming-pc-tower',
] as const;

export const featuredAccessoryIds = [
  'dualsense-wireless-controller',
  'xbox-wireless-controller',
  'switch-pro-controller',
  'wireless-gaming-headset',
  'logitech-g923-racing-wheel',
  'geforce-rtx-graphics-card',
  'mechanical-gaming-keyboard',
  'wireless-gaming-mouse',
] as const;

export const homeHardwareIds = [
  'ps5-console-slim',
  'wireless-gaming-headset',
  'geforce-rtx-graphics-card',
  'logitech-g923-racing-wheel',
] as const;

function selectHardwareProducts(ids: readonly string[]) {
  return ids
    .map((id) => hardwareCatalog.find((product) => product.id === id))
    .filter((product): product is HardwareCatalogProduct => Boolean(product));
}

export function getHardwareProductById(productId: string) {
  return hardwareCatalog.find((product) => product.id === productId) ?? null;
}

export function getFeaturedConsoles() {
  return selectHardwareProducts(featuredConsoleIds);
}

export function getFeaturedAccessories() {
  return selectHardwareProducts(featuredAccessoryIds);
}

export function getHomeHardwareProducts() {
  return selectHardwareProducts(homeHardwareIds);
}

export function getHardwareCatalogByFamily(family: HardwareFamily) {
  return hardwareCatalog.filter((product) => product.family === family);
}

export function getHardwareCatalogByDepartment(department: HardwareDepartment) {
  return hardwareCatalog.filter((product) => product.department === department);
}

export function getHardwareShowcaseCardsByIds(
  ids: readonly string[],
  hrefBase: string | ((product: HardwareCatalogProduct) => string) = '/accessories'
): StorefrontShowcaseCard[] {
  return selectHardwareProducts(ids).map((product) => ({
    id: product.id,
    title: product.title,
    label: `${product.platform} | ${product.department.replace('-', ' ')}`,
    image: product.image,
    href:
      typeof hrefBase === 'function'
        ? hrefBase(product)
        : `${hrefBase}#${product.id}`,
    blurb: product.blurb ?? `${product.department} pick for ${product.platform}.`,
    imageAspect: product.imageAspect,
    imageFit: product.imageFit,
    imagePosition: product.imagePosition,
  }));
}
