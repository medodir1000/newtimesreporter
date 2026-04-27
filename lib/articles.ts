import { articles as fallbackArticles } from "@/lib/mockData";
import { DEFAULT_ARTICLE_AUTHOR, SITE_NAME } from "@/lib/site";

export type ArticleView = {
  id?: number;
  slug: string;
  category: string;
  title: string;
  author: string;
  date: string;
  publishedAtISO: string;
  image: string;
  caption: string;
  content: string[];
  hashtags: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
};

type SupabaseArticle = {
  id: number;
  slug: string;
  category: string | null;
  title: string;
  author: string | null;
  published_at: string | null;
  image_url: string | null;
  content: string | null;
  hashtags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  canonical_url: string | null;
};

function getSupabaseCreds() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { supabaseUrl, supabaseKey };
}

function toParagraphs(content: string | null | undefined): string[] {
  if (!content) return [];
  return content
    .split(/\n\s*\n/g)
    .map((line) => line.trim())
    .filter(Boolean);
}

function mapFallbackArticle(slug: string): ArticleView | null {
  const article = fallbackArticles.find((item) => item.slug === slug);
  if (!article) return null;

  const publishedAtISO = new Date(article.date).toISOString();
  return {
    slug: article.slug,
    category: article.category,
    title: article.title,
    author: article.author,
    date: article.date,
    publishedAtISO,
    image: article.image,
    caption: article.caption,
    content: article.content,
    hashtags: [],
    seoTitle: article.title,
    seoDescription: article.content[0] ?? article.caption
  };
}

function mapSupabaseArticle(row: SupabaseArticle): ArticleView {
  const publishedAt = row.published_at ? new Date(row.published_at) : new Date();
  const safeImage =
    typeof row.image_url === "string" && row.image_url.trim().length > 0
      ? row.image_url.trim()
      : "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80";
  return {
    id: row.id,
    slug: row.slug,
    category: row.category ?? "News",
    title: row.title,
    author: row.author ?? DEFAULT_ARTICLE_AUTHOR,
    date: publishedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    publishedAtISO: publishedAt.toISOString(),
    image: safeImage,
    caption: row.category ? `${row.category} coverage from ${SITE_NAME}.` : `Latest coverage from ${SITE_NAME}.`,
    content: toParagraphs(row.content),
    hashtags: row.hashtags ?? [],
    seoTitle: row.seo_title ?? row.title,
    seoDescription: row.seo_description ?? toParagraphs(row.content)[0],
    seoKeywords: row.seo_keywords ?? [],
    canonicalUrl: row.canonical_url ?? undefined
  };
}

export async function getArticleBySlug(slug: string): Promise<ArticleView | null> {
  const { supabaseUrl, supabaseKey } = getSupabaseCreds();

  if (!supabaseUrl || !supabaseKey) {
    return mapFallbackArticle(slug);
  }

  try {
    const url = new URL(`${supabaseUrl}/rest/v1/articles`);
    url.searchParams.set(
      "select",
      "id,slug,category,title,author,published_at,image_url,content,hashtags,seo_title,seo_description,seo_keywords,canonical_url"
    );
    url.searchParams.set("slug", `eq.${slug}`);
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      return null;
    }

    const rows = (await response.json()) as SupabaseArticle[];
    if (!rows || rows.length === 0) {
      return null;
    }

    return mapSupabaseArticle(rows[0]);
  } catch {
    return null;
  }
}

export async function getRelatedArticles(slug: string, limit = 3): Promise<ArticleView[]> {
  const { supabaseUrl, supabaseKey } = getSupabaseCreds();

  const fallbackPool = fallbackArticles.filter((item) => item.slug !== slug);
  const fallbackItems = [...fallbackPool]
    .sort(() => Math.random() - 0.5)
    .slice(0, limit)
    .map((item) => mapFallbackArticle(item.slug))
    .filter((item): item is ArticleView => Boolean(item));

  if (!supabaseUrl || !supabaseKey) {
    return fallbackItems;
  }

  try {
    const url = new URL(`${supabaseUrl}/rest/v1/articles`);
    url.searchParams.set(
      "select",
      "id,slug,category,title,author,published_at,image_url,content,hashtags,seo_title,seo_description,seo_keywords,canonical_url"
    );
    url.searchParams.set("slug", `neq.${slug}`);
    url.searchParams.set("limit", "24");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      return [];
    }

    const rows = (await response.json()) as SupabaseArticle[];
    if (!rows || rows.length === 0) {
      return [];
    }

    return [...rows]
      .sort(() => Math.random() - 0.5)
      .slice(0, limit)
      .map(mapSupabaseArticle);
  } catch {
    return [];
  }
}

export async function getHomepageArticles(limit = 24): Promise<ArticleView[]> {
  const { supabaseUrl, supabaseKey } = getSupabaseCreds();

  const fallbackItems = fallbackArticles
    .map((item) => mapFallbackArticle(item.slug))
    .filter((item): item is ArticleView => Boolean(item))
    .slice(0, limit);

  if (!supabaseUrl || !supabaseKey) {
    return fallbackItems;
  }

  try {
    const url = new URL(`${supabaseUrl}/rest/v1/articles`);
    url.searchParams.set(
      "select",
      "id,slug,category,title,author,published_at,image_url,content,hashtags,seo_title,seo_description,seo_keywords,canonical_url"
    );
    url.searchParams.set("order", "published_at.desc");
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      },
      next: { revalidate: 120 }
    });

    if (!response.ok) {
      return fallbackItems;
    }

    const rows = (await response.json()) as SupabaseArticle[];
    if (!rows || rows.length === 0) {
      // Supabase is reachable but has no rows: return empty list (do not fallback to mock data).
      return [];
    }

    return rows.map(mapSupabaseArticle);
  } catch {
    return fallbackItems;
  }
}
