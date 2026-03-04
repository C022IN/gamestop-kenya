import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const aboutContent: RoutePageContent = {
  eyebrow: 'About GameStop Kenya',
  title: 'Built In Nairobi For Gamers Across Kenya',
  intro:
    'GameStop Kenya launched in 2019 to make trusted gaming hardware, software, and digital services more accessible locally. We combine strong pricing, local support, and fast fulfillment so players can buy with confidence.',
  facts: [
    { label: 'Founded', value: '2019' },
    { label: 'Customers Served', value: '50,000+' },
    { label: 'Main Hub', value: 'Nairobi' },
    { label: 'Support Window', value: '7 Days' },
  ],
  highlights: [
    'Local support team that understands Kenyan payment and delivery workflows.',
    'Single storefront for consoles, games, accessories, digital codes, and IPTV.',
    'Order communication designed around WhatsApp, email, and quick response times.',
    'Clear post-purchase policies for returns, warranty handling, and issue resolution.',
  ],
  sections: [
    {
      title: 'Our Mission',
      description:
        'We focus on reliable, transparent gaming commerce that works for local buyers.',
      points: [
        'Keep top gaming products accessible with competitive pricing.',
        'Reduce checkout friction with local payment options such as M-Pesa.',
        'Deliver clear pre-sale and post-sale guidance from a local team.',
      ],
    },
    {
      title: 'How We Operate',
      description:
        'Every order flow is designed to be simple, traceable, and support-friendly.',
      points: [
        'Confirmed order updates through trusted channels.',
        'Clear handling for digital deliveries and physical shipping.',
        'Escalation path for warranty, returns, and payment issues.',
      ],
    },
    {
      title: 'What Customers Can Expect',
      description:
        'The goal is not just fast checkout, but repeatable service quality every time.',
      points: [
        'Fast responses for stock, compatibility, and delivery questions.',
        'Practical recommendations by platform and budget.',
        'Consistent support after purchase when you need help.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Do you have a physical office?',
      answer: 'Yes. We operate from Westlands, Nairobi, at ABC Place, 2nd Floor.',
    },
    {
      question: 'What payment methods are supported?',
      answer: 'M-Pesa, Visa, Mastercard, and Airtel Money are supported.',
    },
  ],
  primaryAction: { label: 'Shop Categories', href: '/games' },
  secondaryAction: { label: 'Contact Team', href: '/contact' },
  relatedLinks: [
    { label: 'Careers', href: '/careers' },
    { label: 'Return Policy', href: '/return-policy' },
    { label: 'Warranty Info', href: '/warranty' },
  ],
};

export default function AboutPage() {
  return <RouteContentPage content={aboutContent} />;
}
