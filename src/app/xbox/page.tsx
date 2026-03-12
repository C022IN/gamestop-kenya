import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';
import { getMergedHardwareShowcaseCards } from '@/lib/storefront-media';

const xboxContent: RoutePageContent = {
  eyebrow: 'Xbox Series X|S',
  title: 'Xbox Hardware, Games, And Subscription-Ready Add-Ons',
  intro:
    'Shop Xbox consoles, accessories, and digital options built for high-performance play and value-focused gaming. Compare setup paths and complete checkout with local payment options.',
  facts: [
    { label: 'Console Family', value: 'Series X|S' },
    { label: 'Digital Coverage', value: 'Wallet + Pass' },
    { label: 'Accessory Support', value: 'Available' },
    { label: 'Payments', value: 'M-Pesa + Cards' },
  ],
  highlights: [
    'Xbox-focused guidance for performance and value comparisons.',
    'Accessory and digital options available in one purchase flow.',
    'Works well for players using subscription-first game libraries.',
    'Support team available for compatibility and setup guidance.',
  ],
  sections: [
    {
      title: 'Choosing Between X And S',
      description:
        'Pick the model that aligns with your performance targets and content habits.',
      points: [
        'Series X for maximum performance and broader hardware headroom.',
        'Series S for compact setup and budget-conscious entry.',
        'Consider storage and game size when planning long-term usage.',
      ],
    },
    {
      title: 'Building A Practical Setup',
      description:
        'Balance console spend with the accessories that improve daily usage.',
      points: [
        'Add extra controller for local multiplayer sessions.',
        'Include headset and charging accessories for convenience.',
        'Use digital store for wallet and subscription top-ups.',
      ],
    },
    {
      title: 'Ownership And Support',
      description:
        'We support order flow, delivery tracking, and issue handling after purchase.',
      points: [
        'Track status through your order details page.',
        'Reach support quickly on WhatsApp or email.',
        'Use warranty and return pages for policy-backed next steps.',
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

export default async function XboxPage() {
  const showcaseCards = await getMergedHardwareShowcaseCards(
    [
      'xbox-series-x-console',
      'xbox-wireless-controller',
      'razer-blackshark-v2-pro-2023',
      'logitech-g923-racing-wheel',
    ],
    (product) => (product.department === 'console' ? `/consoles#${product.id}` : `/accessories#${product.id}`)
  );

  return <RouteContentPage content={{ ...xboxContent, showcaseCards }} />;
}
