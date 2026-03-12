import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';
import { getMergedGameShowcaseCards } from '@/lib/storefront-media';

const playstationContent: RoutePageContent = {
  eyebrow: 'PlayStation 5',
  title: 'PS5 Consoles, Games, Accessories, And Wallet Codes',
  intro:
    'Explore the PlayStation lineup with console options, top titles, DualSense accessories, and PSN digital support. Built for players who want performance and premium game experiences.',
  facts: [
    { label: 'Platform', value: 'PlayStation 5' },
    { label: 'Add-Ons', value: 'Controllers + PSN' },
    { label: 'Catalog', value: 'Top Titles' },
    { label: 'Support', value: 'Local Guidance' },
  ],
  highlights: [
    'PS5-focused product guidance for new and upgrading players.',
    'Strong title coverage for action, sports, and competitive play.',
    'Accessory ecosystem support for multiplayer and setup expansion.',
    'Digital wallet top-up options for quick content purchase.',
  ],
  sections: [
    {
      title: 'Hardware Path',
      description: 'Choose console and accessories based on your play goals.',
      points: [
        'Select console variant that matches usage and storage needs.',
        'Add extra controller for local multiplayer.',
        'Plan for headset and charging accessories early.',
      ],
    },
    {
      title: 'Content And Games',
      description:
        'Build a strong starter library using core genres and flagship titles.',
      points: [
        'Combine story-driven and multiplayer titles for balance.',
        'Use deals and bundles where available.',
        'Check digital store for compatible wallet options.',
      ],
    },
    {
      title: 'Post-Purchase Readiness',
      description:
        'Support is available for setup and order-related questions after checkout.',
      points: [
        'Track deliveries through the order page.',
        'Use support for setup and troubleshooting questions.',
        'Review policy pages for returns and warranty flow.',
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
  const showcaseCards = await getMergedGameShowcaseCards([
    'marvel-spiderman-2-ps5',
    'god-of-war-ragnarok-ps5',
    'resident-evil-4-ps5',
    'ea-fc-25-ps5',
  ]);

  return <RouteContentPage content={{ ...playstationContent, showcaseCards }} />;
}
