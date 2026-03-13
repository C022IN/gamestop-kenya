import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';
import { gamingVisuals } from '@/data/gaming-visuals';
import { getMergedHardwareShowcaseCards } from '@/lib/storefront-media';

export const revalidate = 300;

const nintendoContent: RoutePageContent = {
  eyebrow: 'Nintendo Switch',
  title: 'Nintendo Switch Consoles And Family-Friendly Gaming Picks',
  heroImage: gamingVisuals.nintendoSwitch.src,
  heroImageAlt: gamingVisuals.nintendoSwitch.alt,
  intro:
    'Find Nintendo Switch OLED hardware, controllers, and game picks for family play, travel, and flexible docked sessions at home.',
  facts: [
    { label: 'Play Style', value: 'Home + Portable' },
    { label: 'Console Stock', value: 'Switch OLED' },
    { label: 'Digital', value: 'eShop Ready' },
    { label: 'Support', value: 'Local Team' },
  ],
  highlights: [
    'Switch gear is grouped for buyers who want home and portable play in one device.',
    'Controllers and accessories stay easy to pair for travel or docked setups.',
    'Nintendo-first titles and eShop top-ups fit naturally into the same store flow.',
    'Support stays available for setup, delivery, and compatibility questions.',
  ],
  sections: [
    {
      title: 'Start With The Console',
      description: 'The Switch OLED fits buyers who want one system for sofa play and travel.',
      points: [
        'Handheld and docked modes make it easy to share one system across routines.',
        'It works well for mixed age groups and multiplayer households.',
        'Add controllers based on whether the setup is mostly docked or mostly portable.',
      ],
    },
    {
      title: 'Build The Library',
      description: 'Mix flagship Nintendo games with party and long-session titles.',
      points: [
        'Start with one flagship adventure and one shared multiplayer game.',
        'Check deals if you want to bundle games with extra controllers.',
        'Use eShop-ready top-ups if you prefer digital purchases later.',
      ],
    },
    {
      title: 'After Purchase',
      description: 'Keep delivery, setup, and support simple once the order is placed.',
      points: [
        'Track delivery updates through the normal order pages.',
        'Use support for pairing, account, or accessory compatibility questions.',
        'Warranty and returns stay covered through the usual policy path.',
      ],
    },
  ],
  primaryAction: { label: 'Browse Digital Store', href: '/digital-store' },
  secondaryAction: { label: 'View Deals', href: '/deals' },
  relatedLinks: [
    { label: 'Games', href: '/games' },
    { label: 'Accessories', href: '/accessories' },
    { label: 'Track My Order', href: '/orders' },
  ],
};

export default async function NintendoSwitchPage() {
  const showcaseCards = await getMergedHardwareShowcaseCards(
    [
      'nintendo-switch-oled-console',
      'switch-pro-controller',
      'razer-blackshark-v2-pro-2023',
      'logitech-g923-racing-wheel',
    ],
    (product) => (product.department === 'console' ? `/consoles#${product.id}` : `/accessories#${product.id}`)
  );

  return <RouteContentPage content={{ ...nintendoContent, showcaseCards }} />;
}
