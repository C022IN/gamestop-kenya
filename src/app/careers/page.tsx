import RouteContentPage, { type RoutePageContent } from '@/components/RouteContentPage';

const careersContent: RoutePageContent = {
  eyebrow: 'Careers',
  title: 'Help Build Kenya\'s Leading Gaming Store',
  intro:
    'GameStop Kenya is expanding across e-commerce operations, support, content, and merchandising. We are looking for practical problem-solvers who care about customer experience.',
  facts: [
    { label: 'Team Base', value: 'Nairobi' },
    { label: 'Focus', value: 'E-Commerce' },
    { label: 'Work Style', value: 'Fast, Lean' },
    { label: 'Hiring Flow', value: 'Rolling' },
  ],
  highlights: [
    'Opportunities in customer support, catalog operations, and growth.',
    'Hands-on work environment where execution quality matters.',
    'Direct impact on customer outcomes and retention.',
    'Clear alignment between business goals and daily responsibilities.',
  ],
  sections: [
    {
      title: 'Current Hiring Areas',
      description: 'Roles shift based on growth priorities and current projects.',
      points: [
        'Customer support and order operations.',
        'Content and digital merchandising.',
        'Marketplace growth and campaign execution.',
      ],
    },
    {
      title: 'How To Apply',
      description: 'We keep applications straightforward and response-focused.',
      points: [
        'Send your CV and short role fit summary to support@gamestop.co.ke.',
        'Mention relevant platform or e-commerce experience.',
        'Include examples of measurable outcomes where possible.',
      ],
    },
    {
      title: 'What We Value',
      description:
        'Strong execution, accountability, and customer-first decision making are core.',
      points: [
        'Clear communication and ownership.',
        'Operational discipline under changing priorities.',
        'Bias toward practical solutions that improve customer experience.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Do you accept internship applications?',
      answer: 'Yes. Internships are reviewed based on active projects and mentor availability.',
    },
    {
      question: 'Are remote roles available?',
      answer: 'Some roles may support hybrid setups depending on operational needs.',
    },
  ],
  primaryAction: { label: 'Contact Recruitment', href: '/contact' },
  secondaryAction: { label: 'About Us', href: '/about' },
  relatedLinks: [
    { label: 'Blog & News', href: '/blog' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
  ],
};

export default function CareersPage() {
  return <RouteContentPage content={careersContent} />;
}
