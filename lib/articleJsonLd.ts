import type { ArticleView } from "@/lib/articles";

export type NewsArticleJsonLdContext = {
  articleUrl: string;
  siteName: string;
  publisherLogoUrl: string;
};

function absoluteImageUrl(image: string, siteOrigin: string): string {
  const trimmed = image.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const origin = siteOrigin.replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${origin}${path}`;
}

/** Schema.org NewsArticle JSON-LD for Google News / Discover (server-rendered). */
export function buildNewsArticleJsonLd(article: ArticleView, ctx: NewsArticleJsonLdContext): Record<string, unknown> {
  const siteOrigin = new URL(ctx.articleUrl).origin;
  const hero = absoluteImageUrl(article.image, siteOrigin);
  const modified = article.modifiedAtISO ?? article.publishedAtISO;
  const desc =
    (typeof article.seoDescription === "string" && article.seoDescription.trim()) ||
    article.content[0]?.slice(0, 320) ||
    article.caption;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: desc,
    image: [hero],
    datePublished: article.publishedAtISO,
    dateModified: modified,
    author: [
      {
        "@type": "Person",
        name: article.author
      }
    ],
    publisher: {
      "@type": "Organization",
      name: ctx.siteName,
      logo: {
        "@type": "ImageObject",
        url: ctx.publisherLogoUrl
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": ctx.articleUrl
    },
    url: ctx.articleUrl,
    articleSection: article.category,
    isAccessibleForFree: true,
    ...(article.hashtags?.length
      ? {
          keywords: article.hashtags.join(", ")
        }
      : {})
  };
}
