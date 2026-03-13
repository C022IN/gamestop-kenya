import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';
import { gamingVisuals } from '@/data/gaming-visuals';
import { getMergedGameShowcaseCards } from '@/lib/storefront-media';

export const revalidate = 300;

const preOwnedContent: RoutePageContent = {
  eyebrow: 'Pre-Owned Games',
  title: 'Value-Focused Gaming With Verified Condition Checks',
  heroImage: gamingVisuals.gamesHero.src,
  heroImageAlt: gamingVisuals.gamesHero.alt,
  intro:
    'Pre-owned games help players stretch a budget further while still buying major titles with condition checks before sale.',
  facts: [
    { label: 'Price Position', value: 'Value Tier' },
    { label: 'Inventory Style', value: 'Rotating' },
    { label: 'Checks', value: 'Condition Review' },
    { label: 'Support', value: 'Purchase Guidance' },
  ],
  highlights: [
    'Pre-owned titles lower the cost of building a broader game library.',
    'Condition checks are applied before stock goes live on the store.',
    'This page works well for buyers mixing one new title with cheaper extras.',
    'Support can help verify platform compatibility before checkout.',
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

export default async function PreOwnedPage() {
  const showcaseCards = await getMergedGameShowcaseCards([
    'cyberpunk-2077-pre-owned-ps5',
    'forza-horizon-5-pre-owned-xbox',
    'resident-evil-4-ps5',
    'ea-fc-25-ps5',
  ]);

  return <RouteContentPage content={{ ...preOwnedContent, showcaseCards }} />;
}
