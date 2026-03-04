import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const consolesContent: RoutePageContent = {
  eyebrow: 'Consoles',
  title: 'Find The Right Console Setup For Your Play Style',
  intro:
    'From PlayStation and Xbox to Nintendo Switch, our console category is structured to help you compare options, pair accessories, and complete checkout confidently.',
  facts: [
    { label: 'Core Platforms', value: 'PlayStation / Xbox / Nintendo' },
    { label: 'Bundle Options', value: 'Available' },
    { label: 'Accessory Pairing', value: 'In-Store' },
    { label: 'Support', value: 'Pre + Post Sale' },
  ],
  highlights: [
    'Console options organized by platform and generation.',
    'Support for first-time buyers choosing between ecosystems.',
    'Accessory and digital add-on recommendations in the same flow.',
    'Policies for warranty and returns clearly linked from checkout.',
  ],
  sections: [
    {
      title: 'Platform Comparison',
      description:
        'Choose based on preferred game library, performance profile, and ecosystem.',
      points: [
        'PlayStation for exclusives and premium controller features.',
        'Xbox for performance value and subscription-first gaming.',
        'Nintendo for flexible family and portable gameplay.',
      ],
    },
    {
      title: 'Bundle Planning',
      description:
        'A complete setup is often more cost-effective than separate purchases.',
      points: [
        'Pair consoles with essential accessories from day one.',
        'Add digital wallet options for faster game access.',
        'Use deals page to identify active bundle campaigns.',
      ],
    },
    {
      title: 'Ownership Support',
      description:
        'Support does not stop at checkout, especially for setup and warranty help.',
      points: [
        'Setup guidance available through support channels.',
        'Warranty and return steps are documented and actionable.',
        'Order tracking and delivery updates are transparent.',
      ],
    },
  ],
  primaryAction: { label: 'Shop PlayStation', href: '/playstation' },
  secondaryAction: { label: 'Shop Xbox', href: '/xbox' },
  relatedLinks: [
    { label: 'Nintendo Switch', href: '/nintendo-switch' },
    { label: 'Gaming Accessories', href: '/accessories' },
    { label: 'Digital Store', href: '/digital-store' },
  ],
};

export default function ConsolesPage() {
  return <RouteContentPage content={consolesContent} />;
}
