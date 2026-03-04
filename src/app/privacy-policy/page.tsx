import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const privacyPolicyContent: RoutePageContent = {
  eyebrow: 'Privacy Policy',
  title: 'How GameStop Kenya Handles Personal Data',
  intro:
    'We collect only the information needed to process orders, provide support, and improve service quality. We do not sell your personal data to third parties.',
  facts: [
    { label: 'Data Use', value: 'Order + Support' },
    { label: 'Marketing', value: 'Opt-In' },
    { label: 'Payment', value: 'Secure Processors' },
    { label: 'Requests', value: 'Contact Support' },
  ],
  highlights: [
    'Personal data is used for transaction processing and customer support.',
    'Payment data is handled through secure payment providers and channels.',
    'Marketing messages are optional and can be unsubscribed anytime.',
    'Users can request data clarification or correction through support.',
  ],
  sections: [
    {
      title: 'Data We Collect',
      description:
        'Data collection is limited to what is necessary for service delivery and compliance.',
      points: [
        'Basic account and contact details.',
        'Order and payment reference information.',
        'Support history related to your requests.',
      ],
    },
    {
      title: 'How Data Is Used',
      description:
        'Information is used to complete orders, communicate updates, and resolve issues.',
      points: [
        'Order verification, dispatch, and delivery communication.',
        'Fraud prevention and payment confirmation workflows.',
        'Service quality improvement through operational review.',
      ],
    },
    {
      title: 'Your Controls',
      description:
        'You can ask questions about your data and request changes where applicable.',
      points: [
        'Request correction of inaccurate profile data.',
        'Opt out of promotional communications.',
        'Contact support for privacy-related requests.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Do you share my data with third parties?',
      answer: 'Only where required for payment processing, delivery, or legal compliance.',
    },
    {
      question: 'How do I opt out of marketing messages?',
      answer: 'Use the unsubscribe method provided or contact support directly.',
    },
  ],
  primaryAction: { label: 'Contact Data Support', href: '/contact' },
  secondaryAction: { label: 'Terms of Service', href: '/terms-of-service' },
  relatedLinks: [
    { label: 'Return Policy', href: '/return-policy' },
    { label: 'Warranty Info', href: '/warranty' },
    { label: 'About Us', href: '/about' },
  ],
};

export default function PrivacyPolicyPage() {
  return <RouteContentPage content={privacyPolicyContent} />;
}
