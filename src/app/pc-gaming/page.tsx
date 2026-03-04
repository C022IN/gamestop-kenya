import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const pcGamingContent: RoutePageContent = {
  eyebrow: 'PC Gaming',
  title: 'Peripherals, Accessories, And Digital Support For PC Players',
  intro:
    'Build or upgrade your PC gaming setup with practical gear choices, digital wallet options, and support built for local buyers who want reliable performance and value.',
  facts: [
    { label: 'Category Focus', value: 'Gear + Digital' },
    { label: 'Use Cases', value: 'Competitive + Casual' },
    { label: 'Upgrade Path', value: 'Modular' },
    { label: 'Support Model', value: 'Guided' },
  ],
  highlights: [
    'PC setup support centered on practical upgrade priorities.',
    'Accessory options for control, communication, and comfort.',
    'Digital store links for wallet top-ups and software access.',
    'Strong fit for both first-time and experienced PC players.',
  ],
  sections: [
    {
      title: 'Starting With Essentials',
      description:
        'Prioritize the components that most impact your daily play quality first.',
      points: [
        'Reliable mouse and keyboard for control accuracy.',
        'Headset choice based on comfort and communication needs.',
        'Desk setup choices that support long sessions.',
      ],
    },
    {
      title: 'Upgrade Strategy',
      description:
        'A phased approach keeps spending efficient while improving outcomes quickly.',
      points: [
        'Upgrade one bottleneck at a time.',
        'Use deals category to reduce accessory spend.',
        'Match purchases to the games and genres you play most.',
      ],
    },
    {
      title: 'Digital Workflow',
      description:
        'Pair hardware purchases with digital options for a complete setup path.',
      points: [
        'Use digital codes for faster game access.',
        'Track order and support details in one place.',
        'Reach support for compatibility questions before checkout.',
      ],
    },
  ],
  primaryAction: { label: 'Shop Accessories', href: '/accessories' },
  secondaryAction: { label: 'Browse Digital Store', href: '/digital-store' },
  relatedLinks: [
    { label: 'Deals', href: '/deals' },
    { label: 'Games', href: '/games' },
    { label: 'Contact Support', href: '/contact' },
  ],
};

export default function PcGamingPage() {
  return <RouteContentPage content={pcGamingContent} />;
}
