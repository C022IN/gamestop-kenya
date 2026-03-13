import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';
import { gamingVisuals } from '@/data/gaming-visuals';
import { getMergedHardwareShowcaseCards } from '@/lib/storefront-media';

export const revalidate = 300;

const pcGamingContent: RoutePageContent = {
  eyebrow: 'PC Gaming',
  title: 'Graphics Cards, Headsets, And Digital Support For PC Players',
  heroImage: gamingVisuals.pcBuild.src,
  heroImageAlt: gamingVisuals.pcBuild.alt,
  intro:
    'Build or upgrade a gaming PC with named GeForce and Radeon cards, premium headset options, and digital support for your game library.',
  facts: [
    { label: 'Graphics Stock', value: 'GeForce + Radeon' },
    { label: 'Use Cases', value: '1080p / 1440p / 4K' },
    { label: 'Audio', value: 'Premium Wireless' },
    { label: 'Support Model', value: 'Guided' },
  ],
  highlights: [
    'Named ASUS GeForce and Radeon cards show clear price bands instead of generic GPU labels.',
    'Headset options are ready for shooters, voice chat, and longer sessions.',
    'Digital store links help complete the setup after hardware checkout.',
    'The page covers both upgrade buyers and first-time PC gaming builds.',
  ],
  sections: [
    {
      title: 'Choose The GPU Tier',
      description: 'Pick the card around your target resolution and the games you actually play.',
      points: [
        'RTX 4060 suits 1080p-first builds and esports-focused setups.',
        'RTX 5070 Ti targets premium 1440p performance and stronger ray tracing.',
        'RX 7800 XT and RX 9070 XT cover value 1440p through entry-4K builds.',
      ],
    },
    {
      title: 'Audio And Daily Use',
      description: 'After the GPU, headset comfort is usually the upgrade buyers notice fastest.',
      points: [
        'Choose a headset that works for shooters, sports nights, and Discord sessions.',
        'Keep comfort and microphone quality in mind for longer evening use.',
        'Check power and cooling headroom before buying the final graphics tier.',
      ],
    },
    {
      title: 'Complete The Setup',
      description: 'Use the store for hardware first, then finish the rest of the setup cleanly.',
      points: [
        'Use digital codes for quicker access to games after the hardware order.',
        'Track orders and payment status from the same account flow.',
        'Reach support if you want a compatibility check before checkout.',
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
