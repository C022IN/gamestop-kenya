import BlogPageClient from '@/components/blog/BlogPageClient';
import { getBlogPageData } from '@/lib/blog-repository';

export const revalidate = 300;

export default async function BlogPage() {
  const { categories, posts } = await getBlogPageData();
  return <BlogPageClient categories={categories} posts={posts} />;
}
