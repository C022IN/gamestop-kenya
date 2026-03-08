import { blogAuthors, blogCategories, blogPosts } from '@/data/blog';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { BlogAuthor, BlogCategory, BlogPost } from '@/types/blog';

interface BlogAuthorRow {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  social: {
    twitter?: string;
    instagram?: string;
  } | null;
}

interface BlogCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
}

interface BlogPostRow {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  published_at: string;
  read_time: number;
  featured: boolean;
  likes: number;
  views: number;
}

interface BlogTagRow {
  id: string;
  name: string;
}

interface BlogPostTagRow {
  post_id: string;
  tag_id: string;
}

function fallbackBlogPosts(): BlogPost[] {
  return blogPosts;
}

function fallbackCategories(): BlogCategory[] {
  return blogCategories;
}

function mapAuthor(row: BlogAuthorRow): BlogAuthor {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar ?? '',
    bio: row.bio ?? '',
    social: row.social ?? {},
  };
}

function mapCategory(row: BlogCategoryRow): BlogCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    color: row.color ?? 'bg-red-600',
  };
}

export async function listBlogCategories(): Promise<BlogCategory[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return fallbackCategories();
  }

  const { data, error } = await supabase
    .from('blog_categories')
    .select('id, name, slug, description, color')
    .order('name', { ascending: true });

  if (error || !data || data.length === 0) {
    return fallbackCategories();
  }

  return (data as BlogCategoryRow[]).map(mapCategory);
}

export async function listBlogPosts(): Promise<BlogPost[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return fallbackBlogPosts();
  }

  const [{ data: postRows, error: postError }, { data: categoryRows }, { data: authorRows }, { data: tagRows }, { data: postTagRows }] =
    await Promise.all([
      supabase
        .from('blog_posts')
        .select(
          'id, category_id, author_id, title, slug, excerpt, content, cover_image, published_at, read_time, featured, likes, views'
        )
        .eq('is_published', true)
        .order('published_at', { ascending: false }),
      supabase.from('blog_categories').select('id, name, slug, description, color'),
      supabase.from('blog_authors').select('id, name, avatar, bio, social'),
      supabase.from('blog_tags').select('id, name'),
      supabase.from('blog_post_tags').select('post_id, tag_id'),
    ]);

  if (postError || !postRows || postRows.length === 0 || !categoryRows || !authorRows) {
    return fallbackBlogPosts();
  }

  const categoriesById = new Map(
    (categoryRows as BlogCategoryRow[]).map((row) => [row.id, mapCategory(row)])
  );
  const authorsById = new Map(
    (authorRows as BlogAuthorRow[]).map((row) => [row.id, mapAuthor(row)])
  );
  const tagsById = new Map((tagRows as BlogTagRow[] | null | undefined)?.map((row) => [row.id, row.name]) ?? []);
  const tagLinksByPost = new Map<string, string[]>();

  for (const row of (postTagRows as BlogPostTagRow[] | null | undefined) ?? []) {
    const current = tagLinksByPost.get(row.post_id) ?? [];
    const nextTag = tagsById.get(row.tag_id);
    if (nextTag) {
      current.push(nextTag);
    }
    tagLinksByPost.set(row.post_id, current);
  }

  const mapped = (postRows as BlogPostRow[])
    .map((row) => {
      const category = categoriesById.get(row.category_id);
      const author = authorsById.get(row.author_id);

      if (!category || !author) {
        return null;
      }

      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        content: row.content,
        coverImage: row.cover_image ?? '',
        category,
        tags: tagLinksByPost.get(row.id) ?? [],
        author,
        publishedAt: row.published_at,
        readTime: row.read_time,
        featured: row.featured,
        likes: row.likes,
        views: row.views,
      } satisfies BlogPost;
    })
    .filter(Boolean) as BlogPost[];

  return mapped.length > 0 ? mapped : fallbackBlogPosts();
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await listBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function listBlogSlugs(): Promise<Array<{ slug: string }>> {
  const posts = await listBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function getBlogPageData(): Promise<{
  categories: BlogCategory[];
  posts: BlogPost[];
}> {
  const [categories, posts] = await Promise.all([listBlogCategories(), listBlogPosts()]);
  return { categories, posts };
}

export function getFallbackBlogAuthors(): BlogAuthor[] {
  return blogAuthors;
}
