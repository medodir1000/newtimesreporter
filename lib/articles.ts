import { articles as fallbackArticles } from "@/lib/mockData";

export type ArticleView = {
  slug: string;
  category: string;
  title: string;
  author: string;
  date: string;
  publishedAtISO: string;
  image: string;
  caption: string;
  content: string[];
};

type SupabaseArticle = {
  slug: string;
  category: string | null;
  title: string;
  author: string | null;
  published_at: string | null;
  image_url: string | null;
  content: string | null;
};

function getSupabaseCreds() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
    content: article.content
  };
}

function mapSupabaseArticle(row: SupabaseArticle): ArticleView {
  const publishedAt = row.published_at ? new Date(row.published_at) : new Date();
  return {
    slug: row.slug,
    category: row.category ?? "News",
    title: row.title,
    author: row.author ?? "New Time Reporter",
    date: publishedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    publishedAtISO: publishedAt.toISOString(),
    image: row.image_url ?? "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80",
    caption: row.category ? `${row.category} coverage from New Times Reporter.` : "Latest coverage from New Times Reporter.",
    content: toParagraphs(row.content)
  };
}

export async function getArticleBySlug(slug: string): Promise<ArticleView | null> {
  const { supabaseUrl, supabaseKey } = getSupabaseCreds();

  if (!supabaseUrl || !supabaseKey) {
    return mapFallbackArticle(slug);
  }

  try {
    const url = new URL(`${supabaseUrl}/rest/v1/articles`);
    url.searchParams.set("select", "slug,category,title,author,published_at,image_url,content");
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
      return mapFallbackArticle(slug);
    }

    const rows = (await response.json()) as SupabaseArticle[];
    if (!rows || rows.length === 0) {
      return mapFallbackArticle(slug);
    }

    return mapSupabaseArticle(rows[0]);
  } catch {
    return mapFallbackArticle(slug);
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
    url.searchParams.set("select", "slug,category,title,author,published_at,image_url,content");
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
      return fallbackItems;
    }

    const rows = (await response.json()) as SupabaseArticle[];
    if (!rows || rows.length === 0) {
      return fallbackItems;
    }

    return [...rows]
      .sort(() => Math.random() - 0.5)
      .slice(0, limit)
      .map(mapSupabaseArticle);
  } catch {
    return fallbackItems;
  }
}
