import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const contactContent: RoutePageContent = {
  eyebrow: 'Contact Support',
  title: 'Talk To The GameStop Kenya Team',
  intro:
    'Need help with an order, payment, product choice, or setup? Reach our support team through phone, WhatsApp, or email and we will guide you quickly.',
  facts: [
    { label: 'Call / WhatsApp', value: '+254 700 123 456' },
    { label: 'Email', value: 'support@gamestop.co.ke' },
    { label: 'Location', value: 'Westlands' },
    { label: 'Typical Reply', value: '< 2 Hours' },
  ],
  highlights: [
    'Order tracking and delivery help from a local operations team.',
    'Payment troubleshooting support for M-Pesa and card transactions.',
    'Product recommendations based on platform, budget, and use case.',
    'Post-purchase support for setup, warranty routing, and return requests.',
  ],
  sections: [
    {
      title: 'Fastest Way To Reach Us',
      description:
        'For urgent order updates and payment confirmations, WhatsApp is usually fastest.',
      points: [
        'Use +254 700 123 456 for both call and WhatsApp.',
        'Share your order number for immediate lookup.',
        'Attach payment confirmation screenshots if needed.',
      ],
    },
    {
      title: 'Email Support',
      description:
        'Email works best for detailed requests that need documents or longer context.',
      points: [
        'Send to support@gamestop.co.ke.',
        'Include your order number and issue summary.',
        'Expect response updates during operating hours.',
      ],
    },
    {
      title: 'Store Location',
      description:
        'Our Nairobi team can help with order guidance, product checks, and support direction.',
      points: [
        'ABC Place, 2nd Floor, Westlands, Nairobi.',
        'Mon-Sat: 9 AM-8 PM.',
        'Sun: 11 AM-6 PM.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Can I track my order online?',
      answer: 'Yes. Use the Track My Order page with your order number and email.',
    },
    {
      question: 'Can I get help before placing an order?',
      answer: 'Yes. We can recommend products based on platform, budget, and availability.',
    },
  ],
  primaryAction: { label: 'Track My Order', href: '/orders' },
  secondaryAction: { label: 'Return Policy', href: '/return-policy' },
  relatedLinks: [
    { label: 'Warranty Info', href: '/warranty' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
  ],
};

export default function ContactPage() {
  return <RouteContentPage content={contactContent} />;
}
