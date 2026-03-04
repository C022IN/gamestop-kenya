import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const termsContent: RoutePageContent = {
  eyebrow: 'Terms of Service',
  title: 'Store Usage Terms Under Kenyan Law',
  intro:
    'By placing orders through GameStop Kenya, customers agree to our order, payment, fulfillment, and support terms. These terms are interpreted under Kenyan law and operational policy.',
  facts: [
    { label: 'Jurisdiction', value: 'Kenya' },
    { label: 'Scope', value: 'Orders + Services' },
    { label: 'Digital Sales', value: 'Activation Rules Apply' },
    { label: 'Disputes', value: 'Support Escalation First' },
  ],
  highlights: [
    'Orders remain subject to stock and successful payment confirmation.',
    'Digital product delivery starts after transaction validation.',
    'Returns and refunds follow published return policy conditions.',
    'Users must comply with lawful use of purchased services and products.',
  ],
  sections: [
    {
      title: 'Order And Pricing Terms',
      description:
        'Pricing, availability, and order acceptance are confirmed during checkout and verification.',
      points: [
        'Published prices may change without prior notice.',
        'Orders are confirmed only after successful payment checks.',
        'Promotions apply within stated campaign rules and windows.',
      ],
    },
    {
      title: 'Digital Product Terms',
      description:
        'Digital goods have activation and usage rules that differ from physical products.',
      points: [
        'Activated or redeemed codes are final sale.',
        'Delivery timelines depend on payment confirmation status.',
        'Customer is responsible for correct platform selection.',
      ],
    },
    {
      title: 'Support And Resolution',
      description:
        'Support team serves as the first resolution path for service disputes or order concerns.',
      points: [
        'Raise issues promptly with order references.',
        'Escalations follow internal review procedures.',
        'Final outcomes follow policy and legal requirements.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Where can I review refund conditions?',
      answer: 'Refund and return requirements are documented on the Return Policy page.',
    },
    {
      question: 'Do these terms apply to IPTV purchases?',
      answer: 'Yes. Service-based purchases are also covered by the applicable terms.',
    },
  ],
  primaryAction: { label: 'Read Return Policy', href: '/return-policy' },
  secondaryAction: { label: 'Contact Support', href: '/contact' },
  relatedLinks: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Warranty Info', href: '/warranty' },
    { label: 'About Us', href: '/about' },
  ],
};

export default function TermsOfServicePage() {
  return <RouteContentPage content={termsContent} />;
}
