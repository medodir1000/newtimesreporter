import { NextResponse } from "next/server";
import { tickerItems } from "@/lib/mockData";

export const revalidate = 300;

type SupabaseHeadline = {
  title: string;
};

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ items: tickerItems.slice(0, 6), source: "fallback" });
    }

    const url = new URL(`${supabaseUrl}/rest/v1/articles`);
    url.searchParams.set("select", "title");
    url.searchParams.set("order", "published_at.desc");
    url.searchParams.set("limit", "8");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`Supabase ticker fetch failed: ${response.status}`);
    }

    const data = (await response.json()) as SupabaseHeadline[];
    const items = data
      .map((row) => row.title?.trim())
      .filter((title): title is string => Boolean(title))
      .slice(0, 8);

    return NextResponse.json({ items: items.length > 0 ? items : tickerItems.slice(0, 6), source: "supabase" });
  } catch {
    return NextResponse.json({ items: tickerItems.slice(0, 6), source: "fallback" });
  }
}
