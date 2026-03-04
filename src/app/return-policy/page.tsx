import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const returnPolicyContent: RoutePageContent = {
  eyebrow: 'Return Policy',
  title: 'Simple Return Rules With Clear Next Steps',
  intro:
    'Eligible physical products can be returned within 7 days of delivery if unused and in original packaging. Digital products and activated subscriptions are non-returnable once fulfilled.',
  facts: [
    { label: 'Return Window', value: '7 Days' },
    { label: 'Condition', value: 'Unused' },
    { label: 'Packaging', value: 'Original' },
    { label: 'Support Channel', value: 'WhatsApp / Email' },
  ],
  highlights: [
    'Return requests require a valid order number and purchase details.',
    'Digital codes and activated IPTV plans cannot be returned after delivery.',
    'Faulty items are checked for replacement, repair routing, or refund eligibility.',
    'Refunds are processed through the original payment route where possible.',
  ],
  sections: [
    {
      title: 'Eligible Returns',
      description: 'Most unopened or unused physical products can be reviewed for return.',
      points: [
        'Submit request within 7 days of confirmed delivery.',
        'Keep original packaging, accessories, and proof of purchase.',
        'Item condition must match resale or inspection criteria.',
      ],
    },
    {
      title: 'Non-Returnable Products',
      description: 'Some products are final sale once delivered or activated.',
      points: [
        'Redeemed digital codes.',
        'Activated subscriptions or service credentials.',
        'Products damaged due to misuse after delivery.',
      ],
    },
    {
      title: 'Refund Timeline',
      description: 'Refund speed varies by payment rail and provider verification.',
      points: [
        'Inspection is performed before approval.',
        'Approved refunds are sent to original payment method.',
        'Support shares status updates throughout the process.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Can I exchange instead of requesting a refund?',
      answer: 'Yes, where stock is available and item condition qualifies for exchange.',
    },
    {
      question: 'How do I start a return?',
      answer: 'Contact support with your order number and reason for return.',
    },
  ],
  primaryAction: { label: 'Contact Support', href: '/contact' },
  secondaryAction: { label: 'Warranty Info', href: '/warranty' },
  relatedLinks: [
    { label: 'Track My Order', href: '/orders' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
  ],
};

export default function ReturnPolicyPage() {
  return <RouteContentPage content={returnPolicyContent} />;
}
