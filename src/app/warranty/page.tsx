import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const warrantyContent: RoutePageContent = {
  eyebrow: 'Warranty Information',
  title: 'Product Warranty Guidance And Claims Support',
  intro:
    'Warranty terms depend on brand policy, product category, and supplier rules. Keep your proof of purchase and contact support early if you detect faults or performance issues.',
  facts: [
    { label: 'Proof Needed', value: 'Order Receipt' },
    { label: 'Coverage', value: 'By Product Type' },
    { label: 'Validation', value: 'Technical Review' },
    { label: 'Channel', value: 'Support Team' },
  ],
  highlights: [
    'Coverage varies by manufacturer and product class.',
    'Claims require order details and issue description.',
    'Support assists with troubleshooting before replacement routing.',
    'Resolution can include repair guidance, replacement, or escalation.',
  ],
  sections: [
    {
      title: 'Before You Submit A Claim',
      description:
        'Collect key details so support can validate the issue quickly and correctly.',
      points: [
        'Order number and purchase date.',
        'Short description of the fault and when it started.',
        'Photos or video evidence where relevant.',
      ],
    },
    {
      title: 'Claim Assessment',
      description:
        'Our team checks eligibility and can request basic troubleshooting steps first.',
      points: [
        'Initial diagnosis with support guidance.',
        'Validation against product warranty terms.',
        'Routing to replacement, repair, or vendor channel.',
      ],
    },
    {
      title: 'After Approval',
      description:
        'Once warranty eligibility is confirmed, we coordinate the next practical step.',
      points: [
        'Replacement if covered and stock is available.',
        'Alternative resolution path where replacement is unavailable.',
        'Status updates through your preferred support channel.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Does warranty include accidental damage?',
      answer: 'Accidental damage is generally not covered unless explicitly stated by the supplier.',
    },
    {
      question: 'How long does a claim take?',
      answer: 'Timelines vary by product and vendor, but support provides progress updates.',
    },
  ],
  primaryAction: { label: 'Start Warranty Claim', href: '/contact' },
  secondaryAction: { label: 'Return Policy', href: '/return-policy' },
  relatedLinks: [
    { label: 'Track My Order', href: '/orders' },
    { label: 'PlayStation 5', href: '/playstation' },
    { label: 'Xbox Series X|S', href: '/xbox' },
  ],
};

export default function WarrantyPage() {
  return <RouteContentPage content={warrantyContent} />;
}
