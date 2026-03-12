import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';
import { gamingVisuals } from '@/data/gaming-visuals';
import { getMergedHardwareShowcaseCards } from '@/lib/storefront-media';

const xboxContent: RoutePageContent = {
  eyebrow: 'Xbox Series X|S',
  title: 'Xbox Hardware, Games, And Subscription-Ready Add-Ons',
  heroImage: gamingVisuals.gamingLounge.src,
  heroImageAlt: gamingVisuals.gamingLounge.alt,
  intro:
    'Shop Xbox consoles, controllers, headsets, and digital support for players building around Game Pass, sports, and 4K play.',
  facts: [
    { label: 'Console Family', value: 'Series X' },
    { label: 'Digital', value: 'Wallet + Pass' },
    { label: 'Add-Ons', value: 'Controller + Audio' },
    { label: 'Payments', value: 'M-Pesa + Cards' },
  ],
  highlights: [
    'Xbox hardware and Game Pass-ready add-ons stay in one buying flow.',
    'The page covers both premium performance and value-first Xbox setups.',
    'Controllers, headset options, and wallet top-ups are easy to add together.',
    'Local payment methods and support stay available through checkout.',
  ],
  sections: [
    {
      title: 'Choose The Console',
      description: 'Pick the model that matches the way you play and the screen you use.',
      points: [
        'Series X is the best fit for 4K play and bigger physical or digital libraries.',
        'Choose based on your display, storage expectations, and download habits.',
        'Add a second controller early if local football or fighter sessions matter.',
      ],
    },
    {
      title: 'Add The Right Gear',
      description: 'Focus on the pieces that improve daily play instead of padding the basket.',
      points: [
        'Add an Xbox controller for guests and couch multiplayer.',
        'Include a headset for voice chat, shooters, and late-night sessions.',
        'Use wallet or subscription top-ups if you buy digitally after the console.',
      ],
    },
    {
      title: 'After Purchase',
      description: 'Order tracking and support remain easy after the basket is complete.',
      points: [
        'Track shipment status from the order pages once payment clears.',
        'Reach support quickly if you need pairing or delivery help.',
        'Warranty and return steps stay available through the policy pages.',
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
