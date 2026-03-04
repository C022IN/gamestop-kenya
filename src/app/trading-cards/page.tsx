import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const tradingCardsContent: RoutePageContent = {
  eyebrow: 'Trading Cards',
  title: 'Collector-Focused Trading Card Inventory',
  intro:
    'Explore available trading card products with updates driven by demand and supply cycles. This category is curated for collectors looking for trusted local purchase and support flows.',
  facts: [
    { label: 'Category Type', value: 'Collector Goods' },
    { label: 'Inventory Flow', value: 'Rolling Updates' },
    { label: 'Purchase Channel', value: 'Online + Support' },
    { label: 'Availability', value: 'Limited Runs' },
  ],
  highlights: [
    'Inventory updates are curated based on market demand and availability.',
    'Support can assist with sourcing and restock visibility requests.',
    'Category fits collectors building long-term card portfolios.',
    'Secure checkout and local support model remains consistent.',
  ],
  sections: [
    {
      title: 'Category Coverage',
      description:
        'Trading card stock can vary, but the category is maintained as a growing segment.',
      points: [
        'Collector-oriented product additions over time.',
        'Priority handling for high-demand item releases.',
        'Category communication via support and content channels.',
      ],
    },
    {
      title: 'Buying Recommendations',
      description:
        'Use a structured approach to avoid rushed purchases in fast-moving drops.',
      points: [
        'Track releases and monitor category updates regularly.',
        'Confirm item details before checkout completion.',
        'Contact support for availability clarifications.',
      ],
    },
    {
      title: 'Order And Support',
      description:
        'Card category orders follow the same service and policy standards as other products.',
      points: [
        'Order tracking available through the order status page.',
        'Issue handling supported through standard contact channels.',
        'Policy terms apply for returns and warranty where relevant.',
      ],
    },
  ],
  primaryAction: { label: 'View Deals', href: '/deals' },
  secondaryAction: { label: 'Contact Support', href: '/contact' },
  relatedLinks: [
    { label: 'Games', href: '/games' },
    { label: 'Accessories', href: '/accessories' },
    { label: 'Pre-Owned Games', href: '/pre-owned' },
  ],
};

export default function TradingCardsPage() {
  return <RouteContentPage content={tradingCardsContent} />;
}
