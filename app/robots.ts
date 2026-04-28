import type { MetadataRoute } from "next";
import { getSiteUrl, getSitemapUrl } from "@/lib/site";

/** robots.txt — sitemap follows NEXT_PUBLIC_SITE_URL (default https://newtimesreporter.com). */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"]
      }
    ],
    sitemap: getSitemapUrl(),
    host: base
  };
}