import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const accessoriesContent: RoutePageContent = {
  eyebrow: 'Gaming Accessories',
  title: 'Controllers, Headsets, Storage, And Setup Essentials',
  intro:
    'Accessories drive comfort, control, and long-session performance. Shop by platform and use case to complete your setup without guesswork.',
  facts: [
    { label: 'Platforms', value: 'PS / Xbox / Switch / PC' },
    { label: 'Core Types', value: 'Input + Audio + Utility' },
    { label: 'Bundle Fit', value: 'High' },
    { label: 'Support', value: 'Compatibility Help' },
  ],
  highlights: [
    'Accessory options mapped to platform compatibility needs.',
    'Category supports both new setups and incremental upgrades.',
    'Useful add-ons available for multiplayer and streaming use cases.',
    'Support available for choosing the right accessories before checkout.',
  ],
  sections: [
    {
      title: 'Input And Control',
      description:
        'Controller and input devices shape your in-game precision and comfort.',
      points: [
        'Choose by platform generation and preferred grip style.',
        'Add extra controllers for shared or competitive sessions.',
        'Consider charging and storage accessories for convenience.',
      ],
    },
    {
      title: 'Audio And Communication',
      description:
        'Clear communication and reliable audio improve multiplayer experience.',
      points: [
        'Select headsets based on usage duration and environment.',
        'Check mic quality for team and streaming scenarios.',
        'Pair with platform-ready adapters when needed.',
      ],
    },
    {
      title: 'Setup Utility',
      description:
        'Storage, stands, and cables can significantly improve day-to-day usability.',
      points: [
        'Use storage upgrades for larger game libraries.',
        'Add organizational accessories for cleaner desk or TV setup.',
        'Combine utility purchases with active deal campaigns.',
      ],
    },
  ],
  primaryAction: { label: 'Shop Consoles', href: '/consoles' },
  secondaryAction: { label: 'View Deals', href: '/deals' },
  relatedLinks: [
    { label: 'PlayStation 5', href: '/playstation' },
    { label: 'Xbox Series X|S', href: '/xbox' },
    { label: 'PC Gaming', href: '/pc-gaming' },
  ],
};

export default function AccessoriesPage() {
  return <RouteContentPage content={accessoriesContent} />;
}
