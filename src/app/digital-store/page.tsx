import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const digitalStoreContent: RoutePageContent = {
  eyebrow: 'Digital Store',
  title: 'Fast Digital Codes For PlayStation, Xbox, Nintendo, And PC',
  intro:
    'Buy wallet top-ups and digital gaming products with secure payment and fast fulfillment workflows. Ideal when you need immediate access without physical delivery wait times.',
  facts: [
    { label: 'Delivery Model', value: 'Digital Fulfillment' },
    { label: 'Platforms', value: 'PS / Xbox / Nintendo / PC' },
    { label: 'Checkout', value: 'Secure' },
    { label: 'Support', value: 'Activation Help' },
  ],
  highlights: [
    'Digital purchases reduce waiting time for game access.',
    'Coverage spans major gaming ecosystems and wallet formats.',
    'Support available for delivery confirmation and activation guidance.',
    'Works well with bundle planning for full setup purchases.',
  ],
  sections: [
    {
      title: 'Selecting The Right Code',
      description:
        'Correct platform and denomination selection prevents activation issues.',
      points: [
        'Verify platform before completing payment.',
        'Choose value based on planned purchases.',
        'Use support if unsure about compatibility.',
      ],
    },
    {
      title: 'Fulfillment Flow',
      description:
        'Digital deliveries begin after payment verification and processing checks.',
      points: [
        'Order and payment are validated in sequence.',
        'Delivery details are shared through configured channels.',
        'Support can confirm status if delay occurs.',
      ],
    },
    {
      title: 'Best Use Cases',
      description:
        'Digital products are especially useful for fast-access and gifting workflows.',
      points: [
        'Quick wallet top-ups before game launches.',
        'Gift purchases without physical shipping dependencies.',
        'Complement console orders with instant content availability.',
      ],
    },
  ],
  primaryAction: { label: 'Browse Games', href: '/games' },
  secondaryAction: { label: 'Contact Support', href: '/contact' },
  relatedLinks: [
    { label: 'PlayStation 5', href: '/playstation' },
    { label: 'Xbox Series X|S', href: '/xbox' },
    { label: 'Nintendo Switch', href: '/nintendo-switch' },
  ],
};

export default function DigitalStorePage() {
  return <RouteContentPage content={digitalStoreContent} />;
}
