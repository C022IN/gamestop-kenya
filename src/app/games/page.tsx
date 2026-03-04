import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const gamesContent: RoutePageContent = {
  eyebrow: 'Video Games',
  title: 'Shop Top Game Titles Across All Major Platforms',
  intro:
    'Discover bestselling and new-release titles for PlayStation, Xbox, Nintendo, and PC. Choose by platform, genre, and budget with local payment options and support.',
  facts: [
    { label: 'Platforms', value: '4+' },
    { label: 'Genres', value: 'Action To Sports' },
    { label: 'Payments', value: 'M-Pesa + Cards' },
    { label: 'Support', value: 'Local Team' },
  ],
  highlights: [
    'Strong cross-platform catalog including major annual releases.',
    'Clear pricing and checkout flow for both new and returning buyers.',
    'Compatible accessories and digital add-ons available in one store.',
    'Local customer support for product choice and order follow-up.',
  ],
  sections: [
    {
      title: 'Platform Coverage',
      description:
        'We support mainstream gaming platforms with curated title selection.',
      points: [
        'PlayStation and Xbox headline franchises.',
        'Nintendo family and multiplayer-friendly titles.',
        'PC-compatible titles and digital options.',
      ],
    },
    {
      title: 'Buying Guidance',
      description:
        'Choose faster with practical checks before adding products to cart.',
      points: [
        'Confirm version compatibility for your console generation.',
        'Review language and region notes where relevant.',
        'Pair with digital codes or accessories for full setup value.',
      ],
    },
    {
      title: 'After Purchase',
      description:
        'We support fulfillment tracking and post-sale questions without delays.',
      points: [
        'Track physical orders through the order status page.',
        'Get support for fulfillment or compatibility clarifications.',
        'Escalate issues through support channels for fast resolution.',
      ],
    },
  ],
  primaryAction: { label: 'Browse Consoles', href: '/consoles' },
  secondaryAction: { label: 'View Deals', href: '/deals' },
  relatedLinks: [
    { label: 'PlayStation 5', href: '/playstation' },
    { label: 'Xbox Series X|S', href: '/xbox' },
    { label: 'Nintendo Switch', href: '/nintendo-switch' },
  ],
};

export default function GamesPage() {
  return <RouteContentPage content={gamesContent} />;
}
