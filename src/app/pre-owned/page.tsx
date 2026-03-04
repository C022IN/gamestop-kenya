import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const preOwnedContent: RoutePageContent = {
  eyebrow: 'Pre-Owned Games',
  title: 'Value-Focused Gaming With Verified Condition Checks',
  intro:
    'Pre-owned category helps players access more titles at lower price points. Inventory rotates frequently and each listing follows condition and compatibility checks before sale.',
  facts: [
    { label: 'Price Position', value: 'Value Tier' },
    { label: 'Inventory Style', value: 'Rotating' },
    { label: 'Checks', value: 'Condition Review' },
    { label: 'Support', value: 'Purchase Guidance' },
  ],
  highlights: [
    'Lower-cost access to popular games and catalog expansion.',
    'Condition checks applied before listing availability.',
    'Useful for budget-sensitive players building larger libraries.',
    'Support team helps verify compatibility before checkout.',
  ],
  sections: [
    {
      title: 'Why Pre-Owned Works',
      description:
        'This category is ideal when maximizing game variety matters more than sealed packaging.',
      points: [
        'Lower entry price per title.',
        'Good fit for broad genre exploration.',
        'Opportunity to test more games within one budget cycle.',
      ],
    },
    {
      title: 'Condition And Compatibility',
      description:
        'Listings are reviewed to reduce surprises and improve purchase confidence.',
      points: [
        'Condition checks before publication.',
        'Platform compatibility should be confirmed during selection.',
        'Support can validate details when needed.',
      ],
    },
    {
      title: 'Post-Purchase Path',
      description:
        'Orders follow standard tracking and support channels after checkout.',
      points: [
        'Track delivery status through the orders page.',
        'Contact support quickly for product-related concerns.',
        'Use policy pages for return and warranty process details.',
      ],
    },
  ],
  primaryAction: { label: 'Browse Games', href: '/games' },
  secondaryAction: { label: 'View Deals', href: '/deals' },
  relatedLinks: [
    { label: 'Track My Order', href: '/orders' },
    { label: 'Return Policy', href: '/return-policy' },
    { label: 'Warranty Info', href: '/warranty' },
  ],
};

export default function PreOwnedPage() {
  return <RouteContentPage content={preOwnedContent} />;
}
