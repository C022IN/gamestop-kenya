import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const nintendoContent: RoutePageContent = {
  eyebrow: 'Nintendo Switch',
  title: 'Nintendo Switch Consoles And Family-Friendly Gaming Picks',
  intro:
    'Find Nintendo Switch hardware, accessories, and game options built for flexible play at home or on the go. Great for solo users, shared households, and multiplayer groups.',
  facts: [
    { label: 'Play Style', value: 'Home + Portable' },
    { label: 'Audience', value: 'Family + Casual + Core' },
    { label: 'Digital Add-Ons', value: 'eShop Ready' },
    { label: 'Support', value: 'Local Team' },
  ],
  highlights: [
    'Strong category fit for shared and family gaming use cases.',
    'Easy accessory pairing for travel and docked play.',
    'Popular Nintendo title support with digital top-up options.',
    'Reliable support for setup and purchase questions.',
  ],
  sections: [
    {
      title: 'Hardware And Usage Fit',
      description:
        'Switch category is ideal for players who need portability without losing quality.',
      points: [
        'Portable and docked modes support flexible routines.',
        'Good option for mixed age groups in one household.',
        'Accessories can be added based on travel vs home usage.',
      ],
    },
    {
      title: 'Game Library Planning',
      description:
        'Balance flagship Nintendo titles with multiplayer and long-session games.',
      points: [
        'Start with one flagship and one shared multiplayer title.',
        'Check deals for discounted bundles and accessories.',
        'Use digital store for eShop-compatible code support.',
      ],
    },
    {
      title: 'After Purchase Support',
      description:
        'Our team helps with order updates, delivery concerns, and policy guidance.',
      points: [
        'Order tracking and delivery update support.',
        'Guidance for compatibility and account setup concerns.',
        'Policy-backed path for warranty and return requests.',
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

export default function NintendoSwitchPage() {
  return <RouteContentPage content={nintendoContent} />;
}
