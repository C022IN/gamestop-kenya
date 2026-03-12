import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';
import { getMergedHardwareShowcaseCards } from '@/lib/storefront-media';

const pcGamingContent: RoutePageContent = {
  eyebrow: 'PC Gaming',
  title: 'Graphics Cards, Headsets, And Digital Support For PC Players',
  intro:
    'Build or upgrade your PC setup with current GeForce and Radeon cards, premium audio, and digital wallet support for PC libraries.',
  facts: [
    { label: 'Graphics Stock', value: 'GeForce + Radeon' },
    { label: 'Use Cases', value: '1080p / 1440p / 4K' },
    { label: 'Audio', value: 'Premium Wireless' },
    { label: 'Support Model', value: 'Guided' },
  ],
  highlights: [
    'Current GeForce and Radeon cards with clear price bands.',
    'Premium headset option for chat, shooters, and long sessions.',
    'Digital store links for wallet top-ups and software access.',
    'Strong fit for both first-time and experienced PC players.',
  ],
  sections: [
    {
      title: 'Choosing A GPU Tier',
      description:
        'Pick the graphics card around the resolution and game settings you actually want to run.',
      points: [
        'RTX 4060 suits 1080p-first builds and esports setups.',
        'RTX 5070 Ti targets premium 1440p and stronger ray tracing.',
        'Radeon RX 7800 XT and RX 9070 XT cover value 1440p through entry-4K builds.',
      ],
    },
    {
      title: 'Audio And Session Comfort',
      description:
        'Once the GPU is right, audio is usually the next upgrade that buyers feel immediately.',
      points: [
        'Wireless headset coverage helps for shooters, sports nights, and Discord sessions.',
        'Choose gear that fits long sessions without adding desk clutter.',
        'Pair graphics upgrades with cooling and PSU checks before checkout.',
      ],
    },
    {
      title: 'Digital Workflow',
      description:
        'Pair hardware purchases with digital options for a complete setup path.',
      points: [
        'Use digital codes for faster game access.',
        'Track order and support details in one place.',
        'Reach support for compatibility questions before checkout.',
      ],
    },
  ],
  primaryAction: { label: 'Shop Accessories', href: '/accessories' },
  secondaryAction: { label: 'Browse Digital Store', href: '/digital-store' },
  relatedLinks: [
    { label: 'Deals', href: '/deals' },
    { label: 'Games', href: '/games' },
    { label: 'Contact Support', href: '/contact' },
  ],
};

export default async function PcGamingPage() {
  const showcaseCards = await getMergedHardwareShowcaseCards(
    [
      'asus-dual-geforce-rtx-4060-oc-8gb',
      'asus-proart-geforce-rtx-5070-ti-16gb',
      'asus-prime-radeon-rx-9070-xt-16gb',
      'razer-blackshark-v2-pro-2023',
    ],
    (product) => `/accessories#${product.id}`
  );

  return <RouteContentPage content={{ ...pcGamingContent, showcaseCards }} />;
}
