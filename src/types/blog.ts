export interface BlogAuthor {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  social: {
    twitter?: string;
    instagram?: string;
  };
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: BlogCategory;
  tags: string[];
  author: BlogAuthor;
  publishedAt: string;
  readTime: number; // in minutes
  featured: boolean;
  likes: number;
  views: number;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

export interface SocialShare {
  platform: 'facebook' | 'twitter' | 'whatsapp' | 'telegram' | 'copy';
  url: string;
  text: string;
}
