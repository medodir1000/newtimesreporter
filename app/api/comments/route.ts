import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerCreds } from "@/lib/admin";

const MAX_NAME = 120;
const MAX_BODY = 2000;

function supabaseHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };
}

type CommentRow = {
  id: string;
  article_slug: string;
  author_name: string;
  body: string;
  created_at: string;
};

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const { supabaseUrl, supabaseKey } = getSupabaseServerCreds();
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ comments: [] as CommentRow[] });
  }

  const url = new URL(`${supabaseUrl}/rest/v1/article_comments`);
  url.searchParams.set("select", "id,article_slug,author_name,body,created_at");
  url.searchParams.set("article_slug", `eq.${slug}`);
  url.searchParams.set("order", "created_at.asc");

  const response = await fetch(url.toString(), {
    headers: supabaseHeaders(supabaseKey),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: text || "Failed to load comments" }, { status: response.status });
  }

  const comments = (await response.json()) as CommentRow[];
  return NextResponse.json({ comments });
}

type PostBody = {
  slug?: string;
  authorName?: string;
  body?: string;
};

export async function POST(request: NextRequest) {
  const { supabaseUrl, supabaseKey } = getSupabaseServerCreds();
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Comments are not configured (missing Supabase)." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => ({}))) as PostBody;
  const slug = payload.slug?.trim();
  const authorName = payload.authorName?.trim().replace(/\s+/g, " ") ?? "";
  const body = payload.body?.trim().replace(/\r/g, "") ?? "";

  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  if (!authorName || authorName.length > MAX_NAME) {
    return NextResponse.json({ error: `Display name is required (max ${MAX_NAME} characters).` }, { status: 400 });
  }
  if (!body || body.length > MAX_BODY) {
    return NextResponse.json({ error: `Comment is required (max ${MAX_BODY} characters).` }, { status: 400 });
  }

  const articleUrl = new URL(`${supabaseUrl}/rest/v1/articles`);
  articleUrl.searchParams.set("select", "id");
  articleUrl.searchParams.set("slug", `eq.${slug}`);
  articleUrl.searchParams.set("limit", "1");

  const articleRes = await fetch(articleUrl.toString(), {
    headers: supabaseHeaders(supabaseKey),
    cache: "no-store"
  });
  if (!articleRes.ok) {
    return NextResponse.json({ error: "Could not verify article." }, { status: 502 });
  }
  const articleRows = (await articleRes.json()) as { id: number }[];
  if (!articleRows.length) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  const insertUrl = `${supabaseUrl}/rest/v1/article_comments`;
  const insertRes = await fetch(insertUrl, {
    method: "POST",
    headers: {
      ...supabaseHeaders(supabaseKey),
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      article_slug: slug,
      author_name: authorName,
      body
    }),
    cache: "no-store"
  });

  if (!insertRes.ok) {
    const errText = await insertRes.text();
    return NextResponse.json({ error: errText || "Failed to post comment" }, { status: insertRes.status });
  }

  const rows = (await insertRes.json()) as CommentRow[];
  const comment = rows[0];
  return NextResponse.json({ ok: true, comment });
}
