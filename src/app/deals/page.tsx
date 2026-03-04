import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const dealsContent: RoutePageContent = {
  eyebrow: 'Deals',
  title: 'Current Promotions Across Consoles, Games, And Digital',
  intro:
    'Browse active discounts and limited-time bundles while inventory lasts. Our deals section combines flash campaigns, platform bundles, and periodic markdown offers.',
  facts: [
    { label: 'Deal Types', value: 'Flash + Bundle' },
    { label: 'Platforms', value: 'PS / Xbox / Switch / PC' },
    { label: 'Digital Offers', value: 'Yes' },
    { label: 'Stock Model', value: 'Limited' },
  ],
  highlights: [
    'Campaigns are refreshed based on inventory and demand cycles.',
    'Bundle offers pair consoles, accessories, and top titles.',
    'Digital promotions include wallet cards and subscription codes.',
    'Best deals typically move fast, especially during event windows.',
  ],
  sections: [
    {
      title: 'How Deals Are Structured',
      description: 'Promotions are organized for clear value across product types.',
      points: [
        'Flash markdowns on selected fast-moving products.',
        'Bundle pricing for better combined value.',
        'Platform-specific campaigns tied to new releases.',
      ],
    },
    {
      title: 'What To Check Before Purchase',
      description:
        'A quick check helps ensure you pick the right offer before stock rotates.',
      points: [
        'Confirm platform compatibility for games and digital codes.',
        'Review included accessories in bundle offers.',
        'Verify campaign duration and stock status.',
      ],
    },
    {
      title: 'Smart Buying Approach',
      description:
        'Use deals to upgrade strategically rather than buying items in isolation.',
      points: [
        'Prioritize bundles when building a full setup.',
        'Combine deal purchases with digital code discounts.',
        'Track future drops through blog and support updates.',
      ],
    },
  ],
  primaryAction: { label: 'Shop Games', href: '/games' },
  secondaryAction: { label: 'Shop Consoles', href: '/consoles' },
  relatedLinks: [
    { label: 'PlayStation 5', href: '/playstation' },
    { label: 'Xbox Series X|S', href: '/xbox' },
    { label: 'Digital Store', href: '/digital-store' },
  ],
};

export default function DealsPage() {
  return <RouteContentPage content={dealsContent} />;
}
