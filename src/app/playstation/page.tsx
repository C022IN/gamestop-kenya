import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';
import { gamingVisuals } from '@/data/gaming-visuals';
import { getMergedHardwareShowcaseCards } from '@/lib/storefront-media';

const playstationContent: RoutePageContent = {
  eyebrow: 'PlayStation 5',
  title: 'PS5 Consoles, Games, Accessories, And Wallet Codes',
  heroImage: gamingVisuals.playstationConsole.src,
  heroImageAlt: gamingVisuals.playstationConsole.alt,
  intro:
    'Shop PS5 hardware, flagship games, DualSense controllers, and PSN-ready digital support in one PlayStation shelf.',
  facts: [
    { label: 'Console Stock', value: 'PS5 Slim' },
    { label: 'Add-Ons', value: 'DualSense + Audio' },
    { label: 'Digital', value: 'PSN Support' },
    { label: 'Delivery', value: 'Kenya-Wide' },
  ],
  highlights: [
    'PS5 hardware and add-ons are grouped together for faster basket building.',
    'Top PlayStation genres stay easy to shop without leaving the main store.',
    'DualSense, headset, and sim-racing upgrades are available on the same checkout.',
    'PSN top-ups are ready when you want digital purchases after the console order.',
  ],
  sections: [
    {
      title: 'Build The Console Basket',
      description: 'Start with the PS5, then add the pieces most buyers need immediately.',
      points: [
        'Choose the PS5 console first, then add a second DualSense for local play.',
        'Add a headset early if the setup is for shooters, sports nights, or party chat.',
        'Use the same store flow for console, accessories, and digital top-up cards.',
      ],
    },
    {
      title: 'Pick The Right Games',
      description: 'Balance prestige exclusives, competitive titles, and local multiplayer picks.',
      points: [
        'Combine a story-driven game with a football, fighter, or racing title.',
        'Check deal pages before checkout if you are building a first library.',
        'Use PSN wallet top-ups for add-on content and digital purchases later.',
      ],
    },
    {
      title: 'After You Order',
      description: 'Track delivery, ask setup questions, and keep a clean path for support.',
      points: [
        'Track the order through the store order pages after payment.',
        'Reach support if you need help with setup, pairing, or account steps.',
        'Warranty and returns stay available through the usual policy pages.',
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

export default async function PlayStationPage() {
  const showcaseCards = await getMergedHardwareShowcaseCards(
    [
      'ps5-console-slim',
      'dualsense-wireless-controller',
      'razer-blackshark-v2-pro-2023',
      'logitech-g923-racing-wheel',
    ],
    (product) => (product.department === 'console' ? `/consoles#${product.id}` : `/accessories#${product.id}`)
  );

  return <RouteContentPage content={{ ...playstationContent, showcaseCards }} />;
}
