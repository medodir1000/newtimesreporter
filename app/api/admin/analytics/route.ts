import { NextRequest, NextResponse } from "next/server";
import { getMissingSupabaseVars, getSupabaseServerCreds, isAuthorizedAdmin } from "@/lib/admin";

type ArticleRow = {
  slug: string;
  title: string;
};

type ViewRow = {
  article_slug: string;
  country: string | null;
};

function supabaseHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabaseUrl, supabaseKey } = getSupabaseServerCreds();
  if (!supabaseUrl || !supabaseKey) {
    const missing = getMissingSupabaseVars();
    return NextResponse.json({ error: `Supabase config missing: ${missing.join(", ")}` }, { status: 500 });
  }

  const [articlesResponse, viewsResponse] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/articles?select=slug,title&limit=1000`, {
      headers: supabaseHeaders(supabaseKey),
      cache: "no-store"
    }),
    fetch(`${supabaseUrl}/rest/v1/article_views?select=article_slug,country&limit=50000`, {
      headers: supabaseHeaders(supabaseKey),
      cache: "no-store"
    })
  ]);

  const articlesData = (await articlesResponse.json().catch(() => [])) as ArticleRow[];
  const viewsData = (await viewsResponse.json().catch(() => [])) as ViewRow[];

  if (!articlesResponse.ok) {
    return NextResponse.json({ error: "Failed to fetch article analytics base" }, { status: articlesResponse.status });
  }
  if (!viewsResponse.ok) {
    return NextResponse.json({ error: "Failed to fetch views analytics" }, { status: viewsResponse.status });
  }

  const viewsBySlug = new Map<string, number>();
  const countriesBySlug = new Map<string, Map<string, number>>();
  const globalCountries = new Map<string, number>();

  for (const view of viewsData) {
    const slug = view.article_slug;
    if (!slug) continue;
    viewsBySlug.set(slug, (viewsBySlug.get(slug) ?? 0) + 1);

    const country = (view.country || "Unknown").trim() || "Unknown";
    if (!countriesBySlug.has(slug)) countriesBySlug.set(slug, new Map());
    const countryMap = countriesBySlug.get(slug)!;
    countryMap.set(country, (countryMap.get(country) ?? 0) + 1);
    globalCountries.set(country, (globalCountries.get(country) ?? 0) + 1);
  }

  const articleStats = articlesData.map((article) => {
    const totalViews = viewsBySlug.get(article.slug) ?? 0;
    const countryMap = countriesBySlug.get(article.slug) ?? new Map<string, number>();
    const topCountryEntry = [...countryMap.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      slug: article.slug,
      title: article.title,
      views: totalViews,
      topCountry: topCountryEntry?.[0] ?? "Unknown"
    };
  });

  const totalViews = viewsData.length;
  const topCountries = [...globalCountries.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([country, views]) => ({ country, views }));

  return NextResponse.json({
    data: {
      totalViews,
      topCountries,
      byArticle: articleStats
    }
  });
}
