import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin, getMissingSupabaseVars, getSupabaseServerCreds } from "@/lib/admin";

type AdminArticlePayload = {
  slug: string;
  category?: string;
  title: string;
  author?: string;
  published_at?: string;
  image_url?: string;
  content?: string;
  hashtags?: string[];
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  canonical_url?: string;
};

function supabaseHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
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

  const url = new URL(`${supabaseUrl}/rest/v1/articles`);
  url.searchParams.set(
    "select",
    "id,slug,category,title,author,published_at,image_url,content,hashtags,seo_title,seo_description,seo_keywords,canonical_url,created_at"
  );
  url.searchParams.set("order", "published_at.desc");

  const response = await fetch(url.toString(), {
    headers: supabaseHeaders(supabaseKey),
    cache: "no-store"
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data?.message ?? "Failed to fetch articles" }, { status: response.status });
  }

  if (Array.isArray(data)) {
    return NextResponse.json({ data });
  }
  return NextResponse.json({ data: [] });
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabaseUrl, supabaseKey } = getSupabaseServerCreds();
  if (!supabaseUrl || !supabaseKey) {
    const missing = getMissingSupabaseVars();
    return NextResponse.json({ error: `Supabase config missing: ${missing.join(", ")}` }, { status: 500 });
  }

  const body = (await request.json()) as AdminArticlePayload;

  if (!body.title || !body.slug) {
    return NextResponse.json({ error: "title and slug are required" }, { status: 400 });
  }

  const payload: AdminArticlePayload = {
    slug: body.slug,
    title: body.title,
    category: body.category ?? "News",
    author: body.author ?? "New Time Reporter",
    published_at: body.published_at ?? new Date().toISOString(),
    image_url: body.image_url ?? "",
    content: body.content ?? "",
    hashtags: body.hashtags ?? [],
    seo_title: body.seo_title ?? body.title,
    seo_description: body.seo_description ?? "",
    seo_keywords: body.seo_keywords ?? [],
    canonical_url: body.canonical_url ?? ""
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/articles?on_conflict=slug`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(supabaseKey),
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data?.message ?? "Failed to create article", details: data }, { status: response.status });
  }

  return NextResponse.json({ data });
}
