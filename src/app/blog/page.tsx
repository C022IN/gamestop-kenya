'use client';

import { useState } from 'react';
import Link from 'next/link';
import { blogPosts, blogCategories } from '@/data/blog';
import { Button } from '@/components/ui/button';
import { CompactSocialShare } from '@/components/SocialShare';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, Clock, Eye, Heart, User } from 'lucide-react';

export default function BlogPage() {
  const [currency, setCurrency] = useState({ code: 'KES', symbol: 'KSh' });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleCurrency = () =>
    setCurrency(prev => prev.code === 'KES' ? { code: 'USD', symbol: '$' } : { code: 'KES', symbol: 'KSh' });

  const featuredPosts = blogPosts.filter(post => post.featured);
  const filteredPosts = selectedCategory === 'all'
    ? blogPosts
    : blogPosts.filter(post => post.category.slug === selectedCategory);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <span className="bg-red-600/30 text-red-300 text-xs font-bold px-3 py-1.5 rounded-full mb-4 inline-block uppercase tracking-wider">
            GameStop Kenya Blog
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            Gaming News, Reviews & Guides
          </h1>
          <p className="text-lg text-gray-300">
            Your ultimate source for gaming insights, reviews, and community stories from Kenya's #1 gaming destination.
          </p>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredPosts.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredPosts.map((post, index) => (
                <article key={post.id} className={index === 0 ? 'lg:col-span-2' : ''}>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className={`w-full object-cover ${index === 0 ? 'h-72' : 'h-52'}`}
                      />
                      <div className={`absolute top-4 left-4 ${post.category.color} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                        {post.category.name}
                      </div>
                      {post.featured && (
                        <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                          FEATURED
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className={`font-black mb-3 hover:text-red-600 transition-colors ${index === 0 ? 'text-2xl' : 'text-xl'}`}>
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="text-gray-500 mb-4 line-clamp-2 text-sm">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{post.author.name}</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(post.publishedAt)}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{post.readTime} min read</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.views.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.likes}</span>
                          <CompactSocialShare url={`/blog/${post.slug}`} title={post.title} description={post.excerpt} />
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

      {/* Category Filter */}
      <section className="py-6 bg-white border-y border-gray-100 sticky top-20 z-30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              All Articles
            </Button>
            {blogCategories.map((cat) => (
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

      {/* All Articles */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {selectedCategory === 'all' ? 'All Articles' : blogCategories.find(c => c.slug === selectedCategory)?.name}
            </h2>
            <span className="text-gray-400 text-sm">{filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img src={post.coverImage} alt={post.title} className="w-full h-48 object-cover" />
                  <div className={`absolute top-3 left-3 ${post.category.color} text-white px-2 py-1 rounded-full text-xs font-bold`}>
                    {post.category.name}
                  </div>
                  {post.featured && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                      FEATURED
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-base mb-2 hover:text-red-600 transition-colors line-clamp-2">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <img src={post.author.avatar} alt={post.author.name} className="w-6 h-6 rounded-full" />
                      <span>{post.author.name}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}m</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.likes}</span>
                      <CompactSocialShare url={`/blog/${post.slug}`} title={post.title} description={post.excerpt} />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gray-900 text-white py-14">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-2">Stay Updated with Gaming News</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">Get the latest gaming news, reviews, and exclusive deals delivered to your inbox.</p>
          <div className="max-w-md mx-auto flex gap-3">
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none" />
            <Button className="bg-red-600 hover:bg-red-700 rounded-xl font-bold px-6">Subscribe</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
