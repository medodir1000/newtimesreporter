import Script from "next/script";
import type { ArticleView } from "@/lib/articles";
import { buildNewsArticleJsonLd } from "@/lib/articleJsonLd";

type ArticleNewsJsonLdProps = {
  article: ArticleView;
  articleUrl: string;
  siteName: string;
  publisherLogoUrl: string;
};

/** Injects NewsArticle JSON-LD early (beforeInteractive → document head) for crawlers. */
export function ArticleNewsJsonLd({ article, articleUrl, siteName, publisherLogoUrl }: ArticleNewsJsonLdProps) {
  const json = buildNewsArticleJsonLd(article, { articleUrl, siteName, publisherLogoUrl });
  return (
    <Script
      id="news-article-jsonld"
      type="application/ld+json"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
