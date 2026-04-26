import { NextRequest, NextResponse } from "next/server";
import { getMissingSupabaseVars, getSupabaseServerCreds, isAuthorizedAdmin } from "@/lib/admin";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function supabaseHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { supabaseUrl, supabaseKey } = getSupabaseServerCreds();
  if (!supabaseUrl || !supabaseKey) {
    const missing = getMissingSupabaseVars();
    return NextResponse.json({ error: `Supabase config missing: ${missing.join(", ")}` }, { status: 500 });
  }

  const body = await request.json();
  const url = new URL(`${supabaseUrl}/rest/v1/articles`);
  url.searchParams.set("id", `eq.${id}`);

  const response = await fetch(url.toString(), {
    method: "PATCH",
    headers: supabaseHeaders(supabaseKey),
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data?.message ?? "Failed to update article", details: data }, { status: response.status });
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { supabaseUrl, supabaseKey } = getSupabaseServerCreds();
  if (!supabaseUrl || !supabaseKey) {
    const missing = getMissingSupabaseVars();
    return NextResponse.json({ error: `Supabase config missing: ${missing.join(", ")}` }, { status: 500 });
  }

  const url = new URL(`${supabaseUrl}/rest/v1/articles`);
  url.searchParams.set("id", `eq.${id}`);

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: supabaseHeaders(supabaseKey),
    cache: "no-store"
  });

  if (!response.ok) {
    const data = await response.json();
    return NextResponse.json({ error: data?.message ?? "Failed to delete article", details: data }, { status: response.status });
  }

  return NextResponse.json({ success: true });
}
