import { NextResponse } from "next/server";
import { tickerItems } from "@/lib/mockData";
import { getHomepageArticles } from "@/lib/articles";

export const revalidate = 300;

export async function GET() {
  try {
    const homepageArticles = await getHomepageArticles(12);
    const items = homepageArticles
      .map((row) => row.title?.trim())
      .filter((title): title is string => Boolean(title))
      .slice(0, 10);

    return NextResponse.json({ items: items.length > 0 ? items : tickerItems.slice(0, 6), source: "supabase" });
  } catch {
    return NextResponse.json({ items: tickerItems.slice(0, 6), source: "fallback" });
  }
}
