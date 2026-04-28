import type { MetadataRoute } from "next";
import { getArticleSlugsForSitemap } from "@/lib/articles";
import { categories } from "@/lib/mockData";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/about-us`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/terms-of-service`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/contact-us`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/category`, lastModified: now, changeFrequency: "daily", priority: 0.7 }
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.75
  }));

  const articles = await getArticleSlugsForSitemap(5000);
  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/article/${a.slug}`,
    lastModified: new Date(a.publishedAtISO),
    changeFrequency: "weekly",
    priority: 0.85
  }));

  return [...staticPages, ...categoryPages, ...articlePages];
}
