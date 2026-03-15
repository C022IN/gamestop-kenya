import type { RoutePageContent } from '@/components/RouteContentPage';
import { gamingVisuals } from '@/data/gaming-visuals';

export const aboutPageContent: RoutePageContent = {
  eyebrow: 'About GameStop Kenya',
  title: 'Built In Nairobi For Players Across Kenya',
  intro:
    'GameStop Kenya launched in 2019 to make gaming hardware, games, and digital services easier to buy locally.',
  facts: [
    { label: 'Founded', value: '2019' },
    { label: 'Customers', value: '50,000+' },
    { label: 'Main Hub', value: 'Nairobi' },
    { label: 'Support', value: '7 Days' },
  ],
  highlights: [
    'Local support built around Kenyan payments and delivery.',
    'One store for consoles, games, accessories, codes, and IPTV.',
    'Clear order updates and after-sale support.',
  ],
  sections: [
    {
      title: 'What We Do',
      description: 'We keep gaming shopping simple, local, and support-ready.',
      points: [
        'Competitive pricing on key gaming products.',
        'M-Pesa and card checkout for faster buying.',
      ],
    },
    {
      title: 'How We Work',
      description: 'Orders are built to be easy to track and easy to support.',
      points: ['Clear delivery and digital fulfillment flow.', 'Straight support path for returns and warranty.'],
    },
  ],
  faqs: [
    {
      question: 'Do you have a physical office?',
      answer: 'Yes. We operate from ABC Place, 2nd Floor, Westlands, Nairobi.',
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

export const careersPageContent: RoutePageContent = {
  eyebrow: 'Careers',
  title: 'Join A Lean Retail And Support Team',
  intro:
    'We hire practical operators who care about customer experience, clean execution, and fast problem solving.',
  facts: [
    { label: 'Team Base', value: 'Nairobi' },
    { label: 'Focus', value: 'E-Commerce' },
    { label: 'Work Style', value: 'Lean' },
    { label: 'Hiring', value: 'Rolling' },
  ],
  highlights: [
    'Roles span support, catalog work, and growth.',
    'Work is hands-on and outcome-focused.',
    'Strong ownership matters more than process theater.',
  ],
  sections: [
    {
      title: 'Hiring Areas',
      description: 'Openings shift with current growth priorities.',
      points: ['Customer support and order ops.', 'Content, merchandising, and campaign work.'],
    },
    {
      title: 'How To Apply',
      description: 'Applications stay simple.',
      points: [
        'Send your CV and short fit summary to support@gamestop.co.ke.',
        'Include measurable outcomes where possible.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Do you accept internship applications?',
      answer: 'Yes, based on active projects and mentor availability.',
    },
    {
      question: 'Are remote roles available?',
      answer: 'Some roles may support hybrid work depending on operations.',
    },
  ],
  primaryAction: { label: 'Contact Recruitment', href: '/contact' },
  secondaryAction: { label: 'About Us', href: '/about' },
  relatedLinks: [
    { label: 'Blog', href: '/blog' },
    { label: 'Terms', href: '/terms-of-service' },
    { label: 'Privacy', href: '/privacy-policy' },
  ],
};

export const contactPageContent: RoutePageContent = {
  eyebrow: 'Contact Support',
  title: 'Reach The Team Fast',
  intro:
    'For order help, payment issues, or product questions, contact support by phone, WhatsApp, or email.',
  facts: [
    { label: 'Call / WhatsApp', value: '0717402034' },
    { label: 'Email', value: 'support@gamestop.co.ke' },
    { label: 'Location', value: 'Westlands' },
    { label: 'Reply', value: '< 2 Hours' },
  ],
  highlights: [
    'Support helps with orders, delivery, and payment checks.',
    'We can recommend products by platform and budget.',
    'Post-sale help stays available for setup and returns.',
  ],
  sections: [
    {
      title: 'Fastest Option',
      description: 'WhatsApp is usually the quickest route for urgent issues.',
      points: ['Use 0717402034 for call or WhatsApp.', 'Share your order number for faster lookup.'],
    },
    {
      title: 'Visit Or Email',
      description: 'Email works best for detailed cases and attachments.',
      points: ['Send email to support@gamestop.co.ke.', 'Visit ABC Place, 2nd Floor, Westlands, Nairobi.'],
    },
  ],
  faqs: [
    {
      question: 'Can I track my order online?',
      answer: 'Yes. Use the Track My Order page with your order number and email.',
    },
    {
      question: 'Can I get help before placing an order?',
      answer: 'Yes. We can recommend products based on platform, budget, and stock.',
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

export const dealsPageContent: RoutePageContent = {
  eyebrow: 'Deals',
  title: 'Current Deals Across Hardware, Games, And Digital',
  intro:
    'Browse active discounts, bundles, and limited runs while stock lasts.',
  facts: [
    { label: 'Deal Types', value: 'Flash + Bundle' },
    { label: 'Platforms', value: 'PS / Xbox / Switch / PC' },
    { label: 'Digital', value: 'Yes' },
    { label: 'Stock', value: 'Limited' },
  ],
  highlights: [
    'Deals refresh around stock and demand.',
    'Bundles combine consoles, accessories, and games.',
    'Digital offers include wallet cards and subscriptions.',
  ],
  sections: [
    {
      title: 'How Deals Work',
      description: 'Offers are grouped for quick comparison.',
      points: ['Flash markdowns on select products.', 'Bundle pricing on full setups.'],
    },
    {
      title: 'Before You Buy',
      description: 'Check a few basics before stock rotates.',
      points: ['Confirm platform compatibility.', 'Review what is included in bundles.'],
    },
  ],
  primaryAction: { label: 'Shop Games', href: '/games' },
  secondaryAction: { label: 'Shop Consoles', href: '/consoles' },
  relatedLinks: [
    { label: 'PlayStation 5', href: '/playstation' },
    { label: 'Xbox Series X|S', href: '/xbox' },
    { label: 'Digital Store', href: '/digital-store' },
  ],
};

export const digitalStorePageContent: RoutePageContent = {
  eyebrow: 'Digital Store',
  title: 'Fast Codes For PlayStation, Xbox, Nintendo, And PC',
  heroImage: gamingVisuals.gamingLounge.src,
  heroImageAlt: gamingVisuals.gamingLounge.alt,
  intro:
    'Buy wallet top-ups and digital gaming products when you want access without physical delivery.',
  facts: [
    { label: 'Delivery', value: 'Digital' },
    { label: 'Platforms', value: 'PS / Xbox / Nintendo / PC' },
    { label: 'Checkout', value: 'Secure' },
    { label: 'Support', value: 'Activation Help' },
  ],
  highlights: [
    'Digital codes are the fastest top-up option.',
    'Major gaming platforms are covered in one store.',
    'Support stays available for delivery and activation issues.',
  ],
  sections: [
    {
      title: 'Choose The Right Code',
      description: 'Correct platform and value prevent activation issues.',
      points: ['Verify platform before payment.', 'Pick the value that matches your next purchase.'],
    },
    {
      title: 'Fulfillment',
      description: 'Delivery starts after payment checks are complete.',
      points: ['Orders are verified before release.', 'Support can confirm status if a delay occurs.'],
    },
  ],
  primaryAction: { label: 'Browse Gift Cards', href: '/gift-cards' },
  secondaryAction: { label: 'Contact Support', href: '/contact' },
  relatedLinks: [
    { label: 'Gift Cards', href: '/gift-cards' },
    { label: 'PlayStation 5', href: '/playstation' },
    { label: 'Xbox Series X|S', href: '/xbox' },
  ],
};

export const nintendoSwitchPageContent: RoutePageContent = {
  eyebrow: 'Nintendo Switch',
  title: 'Switch Consoles And Family Picks',
  heroImage: gamingVisuals.nintendoSwitch.src,
  heroImageAlt: gamingVisuals.nintendoSwitch.alt,
  intro:
    'Find Switch OLED hardware, controllers, and game picks for travel, family play, and docked sessions at home.',
  facts: [
    { label: 'Play Style', value: 'Home + Portable' },
    { label: 'Console', value: 'Switch OLED' },
    { label: 'Digital', value: 'eShop Ready' },
    { label: 'Support', value: 'Local Team' },
  ],
  highlights: [
    'Switch gear stays grouped for handheld and docked play.',
    'Controllers and accessories are easy to add together.',
    'Nintendo titles and eShop top-ups stay in the same flow.',
  ],
  sections: [
    {
      title: 'Start With The Console',
      description: 'Switch OLED suits buyers who split time between sofa and travel play.',
      points: ['Handheld and docked modes fit mixed routines.', 'Add controllers based on how often you play on TV.'],
    },
    {
      title: 'Build The Library',
      description: 'Mix one flagship title with one shared multiplayer pick.',
      points: ['Bundle games with extra controllers when it makes sense.', 'Use eShop top-ups for later digital buys.'],
    },
  ],
  primaryAction: { label: 'Browse Digital Store', href: '/digital-store' },
  secondaryAction: { label: 'View Deals', href: '/deals' },
  relatedLinks: [
    { label: 'Games', href: '/games' },
    { label: 'Accessories', href: '/accessories' },
    { label: 'Track My Order', href: '/orders' },
  ],
};

export const pcGamingPageContent: RoutePageContent = {
  eyebrow: 'PC Gaming',
  title: 'PC Graphics, Audio, And Digital Support',
  heroImage: gamingVisuals.pcBuild.src,
  heroImageAlt: gamingVisuals.pcBuild.alt,
  intro:
    'Build or upgrade a gaming PC with GeForce and Radeon cards, premium audio, and digital support for your library.',
  facts: [
    { label: 'Graphics', value: 'GeForce + Radeon' },
    { label: 'Use Cases', value: '1080p / 1440p / 4K' },
    { label: 'Audio', value: 'Wireless' },
    { label: 'Support', value: 'Guided' },
  ],
  highlights: [
    'Named GPUs replace vague generic listings.',
    'Headset options cover chat, shooters, and long sessions.',
    'Digital codes help finish the setup fast after hardware checkout.',
  ],
  sections: [
    {
      title: 'Pick The GPU Tier',
      description: 'Choose around your target resolution and main game mix.',
      points: ['RTX 4060 is the entry GeForce option.', 'Higher tiers target strong 1440p and entry 4K builds.'],
    },
    {
      title: 'Finish The Setup',
      description: 'After the GPU, comfort and compatibility matter most.',
      points: ['Choose audio for long nightly use.', 'Ask support if you want a compatibility check first.'],
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

export const playstationPageContent: RoutePageContent = {
  eyebrow: 'PlayStation 5',
  title: 'PS5 Consoles, Games, And Add-Ons',
  heroImage: gamingVisuals.playstationConsole.src,
  heroImageAlt: gamingVisuals.playstationConsole.alt,
  intro:
    'Shop PS5 hardware, flagship games, DualSense controllers, and PSN-ready digital support in one shelf.',
  facts: [
    { label: 'Console', value: 'PS5 Slim' },
    { label: 'Add-Ons', value: 'DualSense + Audio' },
    { label: 'Digital', value: 'PSN Support' },
    { label: 'Delivery', value: 'Kenya-Wide' },
  ],
  highlights: [
    'PS5 hardware and add-ons stay grouped together.',
    'Top PlayStation genres stay easy to shop.',
    'Wallet top-ups are ready for later digital purchases.',
  ],
  sections: [
    {
      title: 'Build The Basket',
      description: 'Start with the console, then add what you will use first.',
      points: ['Add a second DualSense for local play.', 'Include a headset early for chat-heavy setups.'],
    },
    {
      title: 'Pick The Games',
      description: 'Balance a flagship story game with something social or competitive.',
      points: ['Mix single-player with sports, racing, or fighting.', 'Use PSN top-ups for later add-ons and store buys.'],
    },
  ],
  primaryAction: { label: 'Browse Digital Store', href: '/digital-store' },
  secondaryAction: { label: 'View Deals', href: '/deals' },
  relatedLinks: [
    { label: 'Games', href: '/games' },
    { label: 'Accessories', href: '/accessories' },
    { label: 'Track My Order', href: '/orders' },
  ],
};

export const preOwnedPageContent: RoutePageContent = {
  eyebrow: 'Pre-Owned Games',
  title: 'Pre-Owned Games With Lower Entry Prices',
  heroImage: gamingVisuals.gamesHero.src,
  heroImageAlt: gamingVisuals.gamesHero.alt,
  intro:
    'Pre-owned games help buyers stretch a budget further while still picking major titles.',
  facts: [
    { label: 'Price Tier', value: 'Value' },
    { label: 'Inventory', value: 'Rotating' },
    { label: 'Checks', value: 'Condition Review' },
    { label: 'Support', value: 'Available' },
  ],
  highlights: [
    'Pre-owned titles lower the cost of building a library.',
    'Condition checks happen before stock goes live.',
    'Support can help confirm platform fit before checkout.',
  ],
  sections: [
    {
      title: 'Why It Works',
      description: 'This section fits buyers who want more variety for the same budget.',
      points: ['Lower entry price per title.', 'Better for testing more genres in one cycle.'],
    },
    {
      title: 'After Purchase',
      description: 'Orders follow the standard tracking and support flow.',
      points: ['Track delivery from the orders page.', 'Use normal policy pages for returns and warranty.'],
    },
  ],
  primaryAction: { label: 'Browse Games', href: '/games' },
  secondaryAction: { label: 'View Deals', href: '/deals' },
  relatedLinks: [
    { label: 'Track My Order', href: '/orders' },
    { label: 'Return Policy', href: '/return-policy' },
    { label: 'Warranty Info', href: '/warranty' },
  ],
};

export const privacyPolicyPageContent: RoutePageContent = {
  eyebrow: 'Privacy Policy',
  title: 'How We Handle Customer Data',
  intro:
    'We collect the information needed to process orders, provide support, and improve operations. We do not sell personal data.',
  facts: [
    { label: 'Data Use', value: 'Orders + Support' },
    { label: 'Marketing', value: 'Opt-In' },
    { label: 'Payment', value: 'Secure Providers' },
    { label: 'Requests', value: 'Contact Support' },
  ],
  highlights: [
    'Customer data is used for transactions and support.',
    'Payment data is handled through secure processors.',
    'Marketing is optional and can be switched off.',
  ],
  sections: [
    {
      title: 'What We Collect',
      description: 'Collection stays limited to service and compliance needs.',
      points: ['Basic contact details.', 'Order and payment reference data.'],
    },
    {
      title: 'Your Controls',
      description: 'You can ask for corrections or raise privacy questions through support.',
      points: ['Request updates to inaccurate details.', 'Opt out of promotional messages.'],
    },
  ],
  faqs: [
    {
      question: 'Do you share my data with third parties?',
      answer: 'Only where needed for payment, delivery, or legal compliance.',
    },
    {
      question: 'How do I opt out of marketing messages?',
      answer: 'Use the unsubscribe option or contact support directly.',
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

export const returnPolicyPageContent: RoutePageContent = {
  eyebrow: 'Return Policy',
  title: 'Simple Return Rules',
  intro:
    'Eligible physical products can be returned within 7 days if unused and in original packaging. Digital products and activated subscriptions are final sale.',
  facts: [
    { label: 'Window', value: '7 Days' },
    { label: 'Condition', value: 'Unused' },
    { label: 'Packaging', value: 'Original' },
    { label: 'Support', value: 'WhatsApp / Email' },
  ],
  highlights: [
    'A valid order number is required for returns.',
    'Digital codes and activated IPTV plans are not returnable.',
    'Refunds go back through the original payment route where possible.',
  ],
  sections: [
    {
      title: 'Eligible Returns',
      description: 'Most unopened or unused physical products can be reviewed.',
      points: ['Submit within 7 days of delivery.', 'Keep packaging and proof of purchase.'],
    },
    {
      title: 'Refund Timeline',
      description: 'Refund speed depends on inspection and the payment provider.',
      points: ['Items are checked before approval.', 'Support shares updates during the process.'],
    },
  ],
  faqs: [
    {
      question: 'Can I exchange instead of requesting a refund?',
      answer: 'Yes, if stock is available and the item qualifies.',
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

export const termsOfServicePageContent: RoutePageContent = {
  eyebrow: 'Terms of Service',
  title: 'Store Terms Under Kenyan Law',
  intro:
    'By placing an order through GameStop Kenya, customers agree to our pricing, payment, fulfillment, and support terms.',
  facts: [
    { label: 'Jurisdiction', value: 'Kenya' },
    { label: 'Scope', value: 'Orders + Services' },
    { label: 'Digital Sales', value: 'Activation Rules' },
    { label: 'Disputes', value: 'Support First' },
  ],
  highlights: [
    'Orders depend on stock and payment confirmation.',
    'Digital delivery starts after transaction validation.',
    'Returns and refunds follow the published policy.',
  ],
  sections: [
    {
      title: 'Orders And Pricing',
      description: 'Pricing and availability are confirmed during checkout and verification.',
      points: ['Prices may change without notice.', 'Orders are confirmed only after payment checks.'],
    },
    {
      title: 'Digital Products',
      description: 'Digital goods follow different rules from physical products.',
      points: ['Redeemed codes are final sale.', 'Customers are responsible for correct platform selection.'],
    },
  ],
  faqs: [
    {
      question: 'Where can I review refund conditions?',
      answer: 'See the Return Policy page.',
    },
    {
      question: 'Do these terms apply to IPTV purchases?',
      answer: 'Yes. Service-based purchases are also covered.',
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

export const tradingCardsPageContent: RoutePageContent = {
  eyebrow: 'Trading Cards',
  title: 'Trading Card Stock And Collector Support',
  intro:
    'Explore trading card inventory with local checkout and support when stock is available.',
  facts: [
    { label: 'Category', value: 'Collector Goods' },
    { label: 'Inventory', value: 'Rolling' },
    { label: 'Channel', value: 'Online + Support' },
    { label: 'Availability', value: 'Limited' },
  ],
  highlights: [
    'Stock changes with demand and supply.',
    'Support can help with sourcing and restock requests.',
    'Orders follow the same checkout and support model as the rest of the store.',
  ],
  sections: [
    {
      title: 'Category Coverage',
      description: 'This is a smaller, still-growing part of the catalog.',
      points: ['Collector-focused additions over time.', 'Priority handling for high-demand drops.'],
    },
    {
      title: 'Buying Tips',
      description: 'Move carefully on limited drops.',
      points: ['Confirm item details before checkout.', 'Use support for availability questions.'],
    },
  ],
  primaryAction: { label: 'View Deals', href: '/deals' },
  secondaryAction: { label: 'Contact Support', href: '/contact' },
  relatedLinks: [
    { label: 'Games', href: '/games' },
    { label: 'Accessories', href: '/accessories' },
    { label: 'Pre-Owned Games', href: '/pre-owned' },
  ],
};

export const warrantyPageContent: RoutePageContent = {
  eyebrow: 'Warranty Information',
  title: 'Warranty Help And Claim Support',
  intro:
    'Warranty terms depend on product type and supplier policy. Keep your proof of purchase and contact support early if something fails.',
  facts: [
    { label: 'Proof Needed', value: 'Order Receipt' },
    { label: 'Coverage', value: 'By Product Type' },
    { label: 'Validation', value: 'Technical Review' },
    { label: 'Channel', value: 'Support Team' },
  ],
  highlights: [
    'Coverage varies by manufacturer and category.',
    'Claims need order details and a fault summary.',
    'Support helps with troubleshooting before escalation.',
  ],
  sections: [
    {
      title: 'Before You Claim',
      description: 'Collect the basics first so support can review quickly.',
      points: ['Order number and purchase date.', 'Short issue summary plus photos or video if needed.'],
    },
    {
      title: 'Claim Review',
      description: 'We check eligibility, then route the next step.',
      points: ['Support may ask for basic troubleshooting.', 'Resolution may be repair, replacement, or vendor escalation.'],
    },
  ],
  faqs: [
    {
      question: 'Does warranty include accidental damage?',
      answer: 'Usually no, unless the supplier states otherwise.',
    },
    {
      question: 'How long does a claim take?',
      answer: 'Timing varies by product and vendor, but support provides updates.',
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

export const xboxPageContent: RoutePageContent = {
  eyebrow: 'Xbox Series X|S',
  title: 'Xbox Hardware, Games, And Digital Support',
  heroImage: gamingVisuals.gamingLounge.src,
  heroImageAlt: gamingVisuals.gamingLounge.alt,
  intro:
    'Shop Xbox consoles, controllers, headsets, and digital support for Game Pass and 4K-ready setups.',
  facts: [
    { label: 'Console', value: 'Series X' },
    { label: 'Digital', value: 'Wallet + Pass' },
    { label: 'Add-Ons', value: 'Controller + Audio' },
    { label: 'Payments', value: 'M-Pesa + Cards' },
  ],
  highlights: [
    'Xbox hardware and digital add-ons stay in one flow.',
    'The page covers both premium and value-first setups.',
    'Controllers, audio, and wallet top-ups are easy to mix.',
  ],
  sections: [
    {
      title: 'Choose The Console',
      description: 'Pick the model that matches your screen and library plans.',
      points: ['Series X is the fit for 4K-first play.', 'Add a second controller early for local sessions.'],
    },
    {
      title: 'Add The Right Gear',
      description: 'Focus on the items that improve daily play.',
      points: ['Add a headset for voice chat and shooters.', 'Use wallet or subscription top-ups for later digital buys.'],
    },
  ],
  primaryAction: { label: 'Browse Digital Store', href: '/digital-store' },
  secondaryAction: { label: 'View Deals', href: '/deals' },
  relatedLinks: [
    { label: 'Games', href: '/games' },
    { label: 'Accessories', href: '/accessories' },
    { label: 'Track My Order', href: '/orders' },
  ],
};
