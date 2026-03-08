'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CompactSocialShare } from '@/components/SocialShare';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, Clock, Eye, Heart, User } from 'lucide-react';
import type { BlogCategory, BlogPost } from '@/types/blog';

interface BlogPageClientProps {
  categories: BlogCategory[];
  posts: BlogPost[];
}

export default function BlogPageClient({ categories, posts }: BlogPageClientProps) {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleCurrency = () =>
    setCurrency((prev) =>
      prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' }
    );

  const featuredPosts = posts.filter((post) => post.featured);
  const filteredPosts =
    selectedCategory === 'all'
      ? posts
      : posts.filter((post) => post.category.slug === selectedCategory);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      <section className="bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 py-16 text-white">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-red-600/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300">
            GameStop Kenya Blog
          </span>
          <h1 className="mb-4 text-4xl font-black md:text-6xl">
            Gaming News, Reviews & Guides
          </h1>
          <p className="text-lg text-gray-300">
            Your ultimate source for gaming insights, reviews, and community stories from Kenya's
            #1 gaming destination.
          </p>
        </div>
      </section>

      {featuredPosts.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="mb-6 text-2xl font-bold">Featured Articles</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {featuredPosts.map((post, index) => (
                <article key={post.id} className={index === 0 ? 'lg:col-span-2' : ''}>
                  <div className="lux-card overflow-hidden rounded-2xl">
                    <div className="lux-media relative">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className={`w-full object-cover ${index === 0 ? 'h-72' : 'h-52'}`}
                      />
                      <div
                        className={`absolute left-4 top-4 ${post.category.color} rounded-full px-3 py-1 text-xs font-bold text-white`}
                      >
                        {post.category.name}
                      </div>
                      {post.featured && (
                        <div className="absolute right-4 top-4 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-black">
                          FEATURED
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3
                        className={`mb-3 font-black transition-colors hover:text-red-600 ${index === 0 ? 'text-2xl' : 'text-xl'}`}
                      >
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="mb-4 line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {post.author.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(post.publishedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {post.readTime} min read
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {post.views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {post.likes}
                          </span>
                          <CompactSocialShare
                            url={`/blog/${post.slug}`}
                            title={post.title}
                            description={post.excerpt}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="sticky top-20 z-30 border-y border-gray-100 bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              All Articles
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.slug)}
                className={selectedCategory === cat.slug ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {selectedCategory === 'all'
                ? 'All Articles'
                : categories.find((c) => c.slug === selectedCategory)?.name}
            </h2>
            <span className="text-sm text-gray-400">
              {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <article key={post.id} className="lux-card overflow-hidden rounded-2xl">
                <div className="lux-media relative">
                  <img src={post.coverImage} alt={post.title} className="h-48 w-full object-cover" />
                  <div
                    className={`absolute left-3 top-3 ${post.category.color} rounded-full px-2 py-1 text-xs font-bold text-white`}
                  >
                    {post.category.name}
                  </div>
                  {post.featured && (
                    <div className="absolute right-3 top-3 rounded-full bg-yellow-500 px-2 py-1 text-xs font-bold text-black">
                      FEATURED
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="mb-2 line-clamp-2 text-base font-bold transition-colors hover:text-red-600">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="mb-4 line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="h-6 w-6 rounded-full ring-2 ring-white shadow-sm"
                      />
                      <span>{post.author.name}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}m
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.likes}
                      </span>
                      <CompactSocialShare
                        url={`/blog/${post.slug}`}
                        title={post.title}
                        description={post.excerpt}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-900 py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-2 text-3xl font-bold">Stay Updated with Gaming News</h2>
          <p className="mx-auto mb-8 max-w-md text-gray-400">
            Get the latest gaming news, reviews, and exclusive deals delivered to your inbox.
          </p>
          <div className="mx-auto flex max-w-md gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none"
            />
            <Button className="rounded-xl bg-red-600 px-6 font-bold hover:bg-red-700">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
