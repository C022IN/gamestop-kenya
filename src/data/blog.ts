import { BlogPost, BlogCategory, BlogAuthor } from '@/types/blog';

export const blogCategories: BlogCategory[] = [
  {
    id: '1',
    name: 'Game Reviews',
    slug: 'game-reviews',
    description: 'In-depth reviews of the latest games',
    color: 'bg-blue-600'
  },
  {
    id: '2',
    name: 'Gaming News',
    slug: 'gaming-news',
    description: 'Latest news from the gaming world',
    color: 'bg-red-600'
  },
  {
    id: '3',
    name: 'Gaming Guides',
    slug: 'gaming-guides',
    description: 'Tips, tricks, and walkthroughs',
    color: 'bg-green-600'
  },
  {
    id: '4',
    name: 'Kenya Gaming',
    slug: 'kenya-gaming',
    description: 'Gaming culture and community in Kenya',
    color: 'bg-orange-600'
  },
  {
    id: '5',
    name: 'Console News',
    slug: 'console-news',
    description: 'Latest updates on gaming consoles',
    color: 'bg-purple-600'
  }
];

export const blogAuthors: BlogAuthor[] = [
  {
    id: '1',
    name: 'James Kiprop',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    bio: 'Senior Gaming Editor at GameStop Kenya. Passionate about RPGs and fighting games.',
    social: {
      twitter: '@jkiprop_gaming',
      instagram: '@jamesplays_ke'
    }
  },
  {
    id: '2',
    name: 'Sarah Wanjiku',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b25ec60c?w=100&h=100&fit=crop&crop=face',
    bio: 'Gaming journalist covering the Kenyan gaming scene and esports.',
    social: {
      twitter: '@sarahgames_ke',
      instagram: '@wanjiku_gaming'
    }
  },
  {
    id: '3',
    name: 'Michael Otieno',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    bio: 'Console gaming expert and hardware reviewer.',
    social: {
      twitter: '@mike_console',
      instagram: '@otieno_gaming'
    }
  }
];

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Spider-Man 2 Review: A Web-Slinging Masterpiece',
    slug: 'spider-man-2-review-web-slinging-masterpiece',
    excerpt: 'Insomniac Games delivers another stunning Spider-Man adventure that sets new standards for superhero games.',
    content: `
      <p>Marvel's Spider-Man 2 is not just a sequel; it's a love letter to Spider-Man fans and a technical marvel that showcases the PlayStation 5's capabilities. Insomniac Games has outdone themselves, creating an experience that feels both familiar and refreshingly new.</p>

      <h2>Dual Spider-Men, Double the Fun</h2>
      <p>The ability to switch between Peter Parker and Miles Morales adds a dynamic layer to gameplay. Each Spider-Man feels distinct, with unique abilities and fighting styles that keep combat fresh throughout the 20-hour campaign.</p>

      <h2>Web-Swinging Perfection</h2>
      <p>The web-swinging mechanics have been refined to near perfection. Traversing New York City feels effortless and exhilarating, with the DualSense controller's haptic feedback making every swing feel impactful.</p>

      <h2>Visual Spectacle</h2>
      <p>The game is a visual feast on PlayStation 5. Ray-traced reflections, detailed character models, and stunning lighting effects create a believable New York City that's a joy to explore.</p>

      <h2>Final Verdict</h2>
      <p>Spider-Man 2 is essential gaming for PlayStation 5 owners. It's a superhero game that respects its source material while pushing the medium forward. At KSh 8,500, it's worth every shilling.</p>

      <p><strong>Rating: 9.5/10</strong></p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
    category: blogCategories[0],
    tags: ['PlayStation 5', 'Action', 'Review', 'Spider-Man', 'Insomniac'],
    author: blogAuthors[0],
    publishedAt: '2024-11-15',
    readTime: 8,
    featured: true,
    likes: 245,
    views: 3240
  },
  {
    id: '2',
    title: 'The Rise of Gaming Culture in Kenya: From Arcades to Esports',
    slug: 'rise-gaming-culture-kenya-arcades-esports',
    excerpt: 'Exploring how gaming has evolved in Kenya from the early arcade days to the thriving esports scene we see today.',
    content: `
      <p>Kenya's gaming landscape has undergone a remarkable transformation over the past two decades. From the humble arcade centers of the 1990s to today's sophisticated esports tournaments, gaming has become a significant part of Kenyan youth culture.</p>

      <h2>The Arcade Era</h2>
      <p>In the late 1990s and early 2000s, gaming in Kenya was synonymous with arcade centers. Places like Game Palace in Nairobi became gathering spots for gaming enthusiasts. Street Fighter, Tekken, and FIFA were the games that brought communities together.</p>

      <h2>Console Gaming Takes Root</h2>
      <p>The introduction of affordable PlayStation 2 consoles in the mid-2000s revolutionized home gaming. Suddenly, FIFA tournaments moved from arcades to living rooms, and gaming became more accessible to families across the country.</p>

      <h2>The Digital Revolution</h2>
      <p>With improved internet infrastructure and smartphone adoption, mobile gaming exploded in Kenya. Games like PUBG Mobile and Free Fire found massive audiences, creating the foundation for competitive gaming.</p>

      <h2>Esports Emerges</h2>
      <p>Today, Kenya boasts organized esports leagues, gaming cafes in major cities, and professional gamers competing internationally. The Kenya Esports Federation has been instrumental in organizing local tournaments and developing talent.</p>

      <h2>The Future</h2>
      <p>With GameStop Kenya now providing easier access to gaming hardware and digital content, the future looks bright for Kenyan gamers. We're seeing more local content creators, streamers, and professional esports athletes emerging from the region.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop',
    category: blogCategories[3],
    tags: ['Kenya Gaming', 'Esports', 'Gaming Culture', 'History', 'Community'],
    author: blogAuthors[1],
    publishedAt: '2024-11-12',
    readTime: 12,
    featured: true,
    likes: 189,
    views: 2156
  },
  {
    id: '3',
    title: 'PlayStation 5 vs Xbox Series X: Which Console Should You Buy in 2024?',
    slug: 'playstation-5-vs-xbox-series-x-console-comparison-2024',
    excerpt: 'A comprehensive comparison of the latest generation consoles to help you make the right choice for your gaming needs.',
    content: `
      <p>With both the PlayStation 5 and Xbox Series X readily available in Kenya, many gamers are faced with the classic console dilemma. Both systems offer incredible gaming experiences, but which one deserves your hard-earned shillings?</p>

      <h2>Performance Comparison</h2>
      <p>Both consoles deliver 4K gaming at 60fps, with some titles reaching 120fps. The Xbox Series X has a slight edge in raw computing power, while the PS5's custom SSD provides faster loading times.</p>

      <h2>Exclusive Games</h2>
      <p><strong>PlayStation 5 Exclusives:</strong></p>
      <ul>
        <li>Spider-Man 2</li>
        <li>Demon's Souls</li>
        <li>Ratchet & Clank: Rift Apart</li>
        <li>God of War Ragnarök</li>
      </ul>

      <p><strong>Xbox Series X Exclusives:</strong></p>
      <ul>
        <li>Forza Horizon 5</li>
        <li>Halo Infinite</li>
        <li>Microsoft Flight Simulator</li>
        <li>Gears 5</li>
      </ul>

      <h2>Gaming Services</h2>
      <p>Xbox Game Pass offers incredible value with hundreds of games for a monthly fee. PlayStation Plus has been revamped to compete, offering a similar service with classic PlayStation titles.</p>

      <h2>Price in Kenya</h2>
      <p>At GameStop Kenya:</p>
      <ul>
        <li>PlayStation 5: KSh 75,000</li>
        <li>Xbox Series X: KSh 72,000</li>
        <li>Xbox Series S: KSh 45,000 (budget option)</li>
      </ul>

      <h2>Our Recommendation</h2>
      <p>Choose PlayStation 5 if you love exclusive single-player adventures and cutting-edge haptic feedback. Choose Xbox Series X if you prefer multiplayer gaming and want the best value through Game Pass.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=400&fit=crop',
    category: blogCategories[4],
    tags: ['PlayStation 5', 'Xbox Series X', 'Console Comparison', 'Gaming Hardware'],
    author: blogAuthors[2],
    publishedAt: '2024-11-10',
    readTime: 10,
    featured: false,
    likes: 167,
    views: 1890
  },
  {
    id: '4',
    title: 'Super Mario Bros. Wonder: A Return to 2D Magic',
    slug: 'super-mario-bros-wonder-return-2d-magic',
    excerpt: 'Nintendo proves that 2D Mario still has plenty of magic left with this delightful new adventure on Nintendo Switch.',
    content: `
      <p>After years of 3D adventures, Mario returns to his 2D roots with Super Mario Bros. Wonder, and the result is nothing short of magical. This isn't just another 2D Mario game – it's a complete reimagining of what the formula can be.</p>

      <h2>Wonder Effects: Game-Changing Innovation</h2>
      <p>The new Wonder Effects are the star of the show. These transformative moments completely change how levels play, turning Mario into various objects, altering gravity, or changing the entire visual style. Each effect feels fresh and surprising.</p>

      <h2>Visual Brilliance</h2>
      <p>The art style is vibrant and expressive, with hand-drawn animations that bring characters to life. Every frame is bursting with personality, making this one of the most visually appealing Mario games ever created.</p>

      <h2>Multiplayer Mayhem</h2>
      <p>Up to four players can tackle levels together, and the chaos is absolutely delightful. Unlike previous entries, Wonder's multiplayer feels designed from the ground up for cooperative play.</p>

      <h2>Perfect for All Ages</h2>
      <p>The difficulty is perfectly balanced, offering challenges for veteran players while remaining accessible to newcomers. The addition of Easy and Normal difficulties ensures everyone can enjoy the adventure.</p>

      <h2>Value Proposition</h2>
      <p>At KSh 7,000, Super Mario Bros. Wonder offers excellent value. With dozens of levels and high replay value, it's a must-have for any Nintendo Switch owner.</p>

      <p><strong>Rating: 9/10</strong></p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
    category: blogCategories[0],
    tags: ['Nintendo Switch', 'Mario', 'Platformer', 'Review', 'Family Gaming'],
    author: blogAuthors[0],
    publishedAt: '2024-11-08',
    readTime: 6,
    featured: false,
    likes: 203,
    views: 2540
  },
  {
    id: '5',
    title: 'Building Your First Gaming PC in Kenya: A Complete Guide',
    slug: 'building-first-gaming-pc-kenya-complete-guide',
    excerpt: 'Everything you need to know about building a gaming PC in Kenya, from component selection to local suppliers.',
    content: `
      <p>Building your first gaming PC can feel overwhelming, especially in Kenya where component availability and pricing can be challenging. This comprehensive guide will walk you through every step of the process.</p>

      <h2>Understanding Your Budget</h2>
      <p>Gaming PCs in Kenya typically fall into these categories:</p>
      <ul>
        <li><strong>Budget Build (KSh 60,000-80,000):</strong> 1080p gaming at medium settings</li>
        <li><strong>Mid-Range Build (KSh 100,000-150,000):</strong> 1440p gaming at high settings</li>
        <li><strong>High-End Build (KSh 200,000+):</strong> 4K gaming at ultra settings</li>
      </ul>

      <h2>Essential Components</h2>
      <h3>Processor (CPU)</h3>
      <p>For gaming, consider:</p>
      <ul>
        <li>AMD Ryzen 5 5600X (Budget-friendly)</li>
        <li>Intel Core i5-12400F (Balanced performance)</li>
        <li>AMD Ryzen 7 5800X3D (High-end gaming)</li>
      </ul>

      <h3>Graphics Card (GPU)</h3>
      <p>The most important component for gaming:</p>
      <ul>
        <li>RTX 3060 Ti (Excellent 1440p performance)</li>
        <li>RTX 4070 (Great all-around choice)</li>
        <li>RTX 4080 (4K gaming powerhouse)</li>
      </ul>

      <h2>Where to Buy in Kenya</h2>
      <ul>
        <li><strong>Physical Stores:</strong> Computer shops in downtown Nairobi</li>
        <li><strong>Online:</strong> Jumia, Kilimall, and specialized PC retailers</li>
        <li><strong>GameStop Kenya:</strong> Gaming peripherals and accessories</li>
      </ul>

      <h2>Assembly Tips</h2>
      <p>Take your time, ground yourself to prevent static damage, and don't be afraid to ask for help. Many local shops offer assembly services for KSh 3,000-5,000.</p>

      <h2>Recommended Budget Build</h2>
      <ul>
        <li>CPU: AMD Ryzen 5 5600 - KSh 25,000</li>
        <li>GPU: RTX 3060 - KSh 35,000</li>
        <li>RAM: 16GB DDR4 - KSh 8,000</li>
        <li>Storage: 500GB NVMe SSD - KSh 6,000</li>
        <li>Motherboard: B550 - KSh 12,000</li>
        <li>PSU: 650W 80+ Gold - KSh 8,000</li>
        <li>Case: Mid-tower - KSh 5,000</li>
        <li><strong>Total: KSh 99,000</strong></li>
      </ul>
    `,
    coverImage: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=400&fit=crop',
    category: blogCategories[2],
    tags: ['PC Gaming', 'Hardware', 'Guide', 'Kenya', 'Building PC'],
    author: blogAuthors[2],
    publishedAt: '2024-11-05',
    readTime: 15,
    featured: false,
    likes: 156,
    views: 1743
  }
];
