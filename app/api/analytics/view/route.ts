import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerCreds } from "@/lib/admin";

type ViewPayload = {
  slug?: string;
};

function supabaseHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal"
  };
}

function readCountry(request: NextRequest) {
  return (
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-country-code") ??
    "Unknown"
  );
}

function readCity(request: NextRequest) {
  return request.headers.get("x-vercel-ip-city") ?? request.headers.get("cf-ipcity") ?? "Unknown";
}

function buildVisitorHash(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const realIp = request.headers.get("x-real-ip") ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";
  const source = `${forwardedFor}|${realIp}|${userAgent}`;
  return createHash("sha256").update(source).digest("hex");
}

export async function POST(request: NextRequest) {
  const { supabaseUrl, supabaseKey } = getSupabaseServerCreds();
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const body = (await request.json().catch(() => ({}))) as ViewPayload;
  const slug = body.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const payload = {
    article_slug: slug,
    country: readCountry(request),
    city: readCity(request),
    visitor_hash: buildVisitorHash(request)
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/article_views`, {
    method: "POST",
    headers: supabaseHeaders(supabaseKey),
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error: error || "Failed to record view" }, { status: response.status });
  }

  return NextResponse.json({ ok: true });
}
