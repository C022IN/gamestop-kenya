import { notFound } from 'next/navigation';
import Link from 'next/link';
import { blogPosts } from '@/data/blog';
import SocialShare from '@/components/SocialShare';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Eye, Heart, User, ArrowLeft, Tag } from 'lucide-react';

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = blogPosts.find(post => post.slug === slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = blogPosts
    .filter(p => p.id !== post.id && p.category.id === post.category.id)
    .slice(0, 3);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back to Blog */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/blog">
            <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Blog</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Category Badge */}
            <div className={`inline-block ${post.category.color} text-white px-4 py-2 rounded-full text-sm font-semibold mb-6`}>
              {post.category.name}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {post.excerpt}
            </p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8 pb-8 border-b">
              <div className="flex items-center space-x-2">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">{post.author.name}</p>
                  <p className="text-xs">{post.author.bio}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.publishedAt)}</span>
              </div>

              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{post.readTime} min read</span>
              </div>

              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{post.views.toLocaleString()} views</span>
              </div>

              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{post.likes} likes</span>
              </div>
            </div>

            {/* Cover Image */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-96 object-cover rounded-lg mb-12"
            />

            {/* Article Content */}
            <div
              className="prose prose-lg max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  <Tag className="h-3 w-3" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>

            {/* Social Sharing */}
            <div className="bg-gray-50 rounded-lg p-6 mb-12">
              <SocialShare
                url={`/blog/${post.slug}`}
                title={post.title}
                description={post.excerpt}
              />
            </div>

            {/* Author Bio */}
            <div className="bg-gray-50 rounded-lg p-6 mb-12">
              <div className="flex items-start space-x-4">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-16 h-16 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    About {post.author.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{post.author.bio}</p>
                  <div className="flex space-x-3">
                    {post.author.social.twitter && (
                      <a
                        href={`https://twitter.com/${post.author.social.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Twitter
                      </a>
                    )}
                    {post.author.social.instagram && (
                      <a
                        href={`https://instagram.com/${post.author.social.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-600"
                      >
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <article key={relatedPost.id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <img
                      src={relatedPost.coverImage}
                      alt={relatedPost.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 hover:text-red-600 transition-colors">
                        <Link href={`/blog/${relatedPost.slug}`}>
                          {relatedPost.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{relatedPost.readTime} min read</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="bg-red-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Gaming?</h2>
          <p className="text-xl mb-8">
            Check out our latest gaming products and exclusive deals
          </p>
          <div className="space-x-4">
            <Link href="/">
              <Button className="bg-white text-red-600 hover:bg-gray-100">
                Shop Now
              </Button>
            </Link>
            <Link href="/blog">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-red-600">
                Read More Articles
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
