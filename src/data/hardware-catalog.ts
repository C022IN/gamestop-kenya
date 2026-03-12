import type { StorefrontProduct, StorefrontShowcaseCard } from '@/lib/storefront-types';

export type HardwareFamily = 'PlayStation' | 'Xbox' | 'Nintendo' | 'PC' | 'Universal';
export type HardwareDepartment = 'console' | 'controller' | 'audio' | 'sim-racing' | 'pc-part';

export interface HardwareCatalogProduct extends StorefrontProduct {
  family: HardwareFamily;
  department: HardwareDepartment;
  compatibility: string[];
}

const productShot = {
  ps5Slim:
    'https://commons.wikimedia.org/wiki/Special:FilePath/PlayStation%205%20and%20DualSense.jpg',
  xboxSeriesX:
    'https://commons.wikimedia.org/wiki/Special:FilePath/Xbox%20series%20X%20(50648118708).jpg',
  switchOled:
    'https://commons.wikimedia.org/wiki/Special:FilePath/Nintendo%20Switch%20-%20OLED.jpg',
  dualSense:
    'https://commons.wikimedia.org/wiki/Special:FilePath/Playstation%20Dualsense%20controller.jpg',
  xboxController:
    'https://commons.wikimedia.org/wiki/Special:FilePath/Xbox%20wireless%20Controller%20-%204.jpg',
  switchProController:
    'https://commons.wikimedia.org/wiki/Special:FilePath/Nintendo-Switch-Pro-Controller-FL.jpg',
  razerHeadset:
    'https://static.bhphoto.com/images/images1000x1000/razer_rz04_04530100_r3u1_blackshark_v2_pro_wireless_1694084651_1785960.jpg',
  logitechG923:
    'https://static.bhphoto.com/images/images1000x1000/logitech_941_000147_g923_racing_wheel_for_1598941357_1587143.jpg',
  rtx4060:
    'https://dlcdnwebimgs.asus.com/gain/97e4d841-d393-4bc5-962f-e6ba7883726b/w800',
  rtx5070Ti:
    'https://dlcdnwebimgs.asus.com/files/media/a5c1666a-903c-4856-b5ac-52e41477674c/v1/img/flow/pd.png',
  rx7800Xt:
    'https://dlcdnwebimgs.asus.com/files/media/f419dd5a-4c55-4d54-bb10-b95ef3ecc878/v1/img/kv/pd.png',
  rx9070Xt:
    'https://dlcdnwebimgs.asus.com/files/media/50d64d8d-95f8-4e38-95f1-5dd8ae53c8ad/v1/img/kv/pd.webp',
} as const;

export const hardwareCatalog: HardwareCatalogProduct[] = [
  {
    id: 'ps5-console-slim',
    title: 'Sony PlayStation 5 Slim Console',
    image: productShot.ps5Slim,
    price: 75900,
    platform: 'PlayStation',
    rating: 4.9,
    inStock: true,
    family: 'PlayStation',
    department: 'console',
    compatibility: ['PS5 discs', 'DualSense', 'PS Plus'],
    blurb: '1TB PS5 Slim console for premium single-player releases, sports nights, and fast SSD loading.',
    details: ['Disc edition', '1TB storage', 'PSN and PS Plus ready'],
    imageAspect: 'card',
    imageFit: 'contain',
    imagePosition: 'center',
  },
  {
    id: 'xbox-series-x-console',
    title: 'Microsoft Xbox Series X',
    image: productShot.xboxSeriesX,
    price: 71900,
    platform: 'Xbox',
    rating: 4.8,
    inStock: true,
    family: 'Xbox',
    department: 'console',
    compatibility: ['Game Pass', 'Series X|S games', '4K 120Hz setups'],
    blurb: 'Flagship Xbox console for Game Pass libraries, high-frame-rate play, and living-room 4K setups.',
    details: ['1TB storage', 'Game Pass ready', 'Series X controller included'],
    imageAspect: 'card',
    imageFit: 'contain',
    imagePosition: 'center',
  },
  {
    id: 'nintendo-switch-oled-console',
    title: 'Nintendo Switch OLED',
    image: productShot.switchOled,
    price: 45500,
    platform: 'Nintendo',
    rating: 4.9,
    inStock: true,
    family: 'Nintendo',
    department: 'console',
    compatibility: ['Handheld play', 'Docked TV play', 'Nintendo eShop'],
    blurb: 'OLED Switch for family gaming, travel, and docked sessions with Nintendo exclusives.',
    details: ['OLED panel', 'Dock included', 'Joy-Con pair in the box'],
    imageAspect: 'card',
    imageFit: 'contain',
    imagePosition: 'center',
  },
  {
    id: 'dualsense-wireless-controller',
    title: 'Sony DualSense Wireless Controller',
    image: productShot.dualSense,
    price: 11900,
    platform: 'PlayStation',
    rating: 4.8,
    inStock: true,
    family: 'PlayStation',
    department: 'controller',
    compatibility: ['PS5', 'PC over USB-C', 'Local multiplayer'],
    blurb: 'Official PS5 pad with adaptive triggers and haptics for second-player and replacement setups.',
    details: ['Adaptive triggers', 'Built-in microphone', 'USB-C charging'],
    imageAspect: 'card',
    imageFit: 'contain',
    imagePosition: 'center',
  },
  {
    id: 'xbox-wireless-controller',
    title: 'Xbox Wireless Controller',
    image: productShot.xboxController,
    price: 9800,
    platform: 'Xbox',
    rating: 4.7,
    inStock: true,
    family: 'Xbox',
    department: 'controller',
    compatibility: ['Xbox Series X|S', 'Windows PC', 'Cloud gaming'],
    blurb: 'Official Xbox controller for console, PC, and cloud sessions with broad pairing support.',
    details: ['Bluetooth pairing', 'Textured grip', 'USB-C ready'],
    imageAspect: 'card',
    imageFit: 'contain',
    imagePosition: 'center',
  },
  {
    id: 'switch-pro-controller',
    title: 'Nintendo Switch Pro Controller',
    image: productShot.switchProController,
    price: 9200,
    platform: 'Nintendo',
    rating: 4.7,
    inStock: true,
    family: 'Nintendo',
    department: 'controller',
    compatibility: ['Nintendo Switch', 'Docked play', 'Local co-op'],
    blurb: 'Full-size Switch controller for Zelda, Mario Kart, Smash, and longer docked sessions.',
    details: ['Wireless play', 'Long battery life', 'TV-mode comfort'],
    imageAspect: 'card',
    imageFit: 'contain',
    imagePosition: 'center',
  },
  {
    id: 'razer-blackshark-v2-pro-2023',
    title: 'Razer BlackShark V2 Pro Wireless Headset',
    image: productShot.razerHeadset,
    price: 24900,
    platform: 'Universal',
    rating: 4.8,
    inStock: true,
    family: 'Universal',
    department: 'audio',
    compatibility: ['PlayStation', 'Xbox', 'PC', 'Mobile voice chat'],
    blurb: 'Premium wireless headset for competitive shooters, football chat, and long evening sessions.',
    details: ['Wireless audio', 'Detachable mic', 'Closed-back comfort'],
    imageAspect: 'card',
    imageFit: 'contain',
    imagePosition: 'center',
  },
  {
    id: 'logitech-g923-racing-wheel',
    title: 'Logitech G923 Racing Wheel And Pedals',
    image: productShot.logitechG923,
    price: 49800,
    platform: 'Universal',
    rating: 4.8,
    inStock: true,
    family: 'Universal',
    department: 'sim-racing',
    compatibility: ['PlayStation', 'Xbox', 'PC racing titles'],
    blurb: 'Official Logitech wheel and pedals for Forza, Gran Turismo, F1, and serious sim-racing setups.',
    details: ['Wheel + pedals', 'Desk clamp included', 'Works with shifter add-on'],
    imageAspect: 'card',
    imageFit: 'contain',
    imagePosition: 'center',
  },
  {
    id: 'asus-dual-geforce-rtx-4060-oc-8gb',
    title: 'ASUS Dual GeForce RTX 4060 OC 8GB',
    image: productShot.rtx4060,
    price: 68900,
    priceNote: 'Range KSh 68,900 - 77,000',
    platform: 'PC',
    rating: 4.7,
    inStock: true,
    family: 'PC',
    department: 'pc-part',
    compatibility: ['1080p ultra', 'DLSS', 'Compact ATX builds'],
    blurb: 'Entry GeForce option for 1080p and esports builds that still want DLSS and current-gen efficiency.',
    details: ['8GB GDDR6', 'DLSS support', 'Dual-fan cooler'],
    imageAspect: 'card',
    imageFit: 'contain',
    imagePosition: 'center',
  },
  {
    id: 'asus-proart-geforce-rtx-5070-ti-16gb',
    title: 'ASUS ProArt GeForce RTX 5070 Ti OC 16GB',
    image: productShot.rtx5070Ti,
    price: 129900,
    priceNote: 'Range KSh 129,900 - 149,000',
    platform: 'PC',
    rating: 4.9,
    inStock: true,
    family: 'PC',
    department: 'pc-part',
    compatibility: ['1440p ultra', '4K upscaling', 'Creator + gaming rigs'],
    blurb: 'High-end GeForce pick for 1440p ultra settings, strong ray tracing, and premium creator-plus-gaming builds.',
    details: ['16GB VRAM', 'OC edition', 'Triple-slot cooling'],
    imageAspect: 'card',
    imageFit: 'contain',
    imagePosition: 'center',
  },
  {
    id: 'asus-tuf-radeon-rx-7800-xt-16gb',
    title: 'ASUS TUF Radeon RX 7800 XT 16GB',
    image: productShot.rx7800Xt,
    price: 85900,
    priceNote: 'Range KSh 85,900 - 99,000',
    platform: 'PC',
    rating: 4.8,
    inStock: true,
    family: 'PC',
    department: 'pc-part',
    compatibility: ['1440p gaming', 'DisplayPort builds', '16GB VRAM libraries'],
    blurb: 'Value-first Radeon card for 1440p players who want stronger VRAM headroom without jumping into flagship pricing.',
    details: ['16GB VRAM', 'Triple-fan cooler', 'AMD FidelityFX ready'],
    imageAspect: 'card',
    imageFit: 'contain',
    imagePosition: 'center',
  },
  {
    id: 'asus-prime-radeon-rx-9070-xt-16gb',
    title: 'ASUS Prime Radeon RX 9070 XT 16GB',
    image: productShot.rx9070Xt,
    price: 118900,
    priceNote: 'Range KSh 118,900 - 139,000',
    platform: 'PC',
    rating: 4.8,
    inStock: true,
    family: 'PC',
    department: 'pc-part',
    compatibility: ['1440p max', '4K gaming', 'Modern Radeon builds'],
    blurb: 'Current Radeon performance tier for gamers building a sharper 1440p or entry-4K rig around AMD graphics.',
    details: ['16GB VRAM', 'Prime cooling design', 'Modern Radeon feature set'],
    imageAspect: 'card',
    imageFit: 'contain',
    imagePosition: 'center',
  },
];

export const featuredConsoleIds = [
  'ps5-console-slim',
  'xbox-series-x-console',
  'nintendo-switch-oled-console',
] as const;

export const featuredAccessoryIds = [
  'dualsense-wireless-controller',
  'xbox-wireless-controller',
  'switch-pro-controller',
  'razer-blackshark-v2-pro-2023',
  'logitech-g923-racing-wheel',
  'asus-dual-geforce-rtx-4060-oc-8gb',
  'asus-proart-geforce-rtx-5070-ti-16gb',
  'asus-prime-radeon-rx-9070-xt-16gb',
] as const;

export const homeHardwareIds = [
  'ps5-console-slim',
  'razer-blackshark-v2-pro-2023',
  'asus-proart-geforce-rtx-5070-ti-16gb',
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

export const lockedHardwareMediaIds = [
  'ps5-console-slim',
  'xbox-series-x-console',
  'nintendo-switch-oled-console',
  'dualsense-wireless-controller',
  'xbox-wireless-controller',
  'switch-pro-controller',
] as const;
