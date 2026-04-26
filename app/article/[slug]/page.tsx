import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Facebook, Linkedin, Twitter } from "lucide-react";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { Footer } from "@/components/Footer";
import { FloatingShareBar } from "@/components/FloatingShareBar";
import { MustReadCard } from "@/components/MustReadCard";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { blurPlaceholderDataURL, unsplashArticle } from "@/lib/images";
import { getArticleBySlug, getHomepageArticles, getRelatedArticles } from "@/lib/articles";
import { articles, tickerItems } from "@/lib/mockData";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found | New Times Reporter",
      description: "This article is unavailable."
    };
  }

  const description = article.seoDescription ?? article.content[0] ?? article.caption;

  return {
    title: article.seoTitle ?? article.title,
    description,
    keywords: article.seoKeywords,
    alternates: article.canonicalUrl ? { canonical: article.canonicalUrl } : undefined,
    openGraph: {
      title: article.seoTitle ?? article.title,
      description,
      type: "article",
      images: [{ url: article.image, alt: article.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle ?? article.title,
      description,
      images: [article.image]
    }
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const articleData = await getArticleBySlug(slug);
  const relatedArticles = await getRelatedArticles(slug, 3);
  const sidebarPool = (await getHomepageArticles(20)).filter((item) => item.slug !== slug);
  const latestNews = sidebarPool.slice(0, 3).map((item) => ({
    slug: item.slug,
    title: item.title,
    category: item.category,
    image: item.image,
    time: item.date
  }));
  const mostRead = sidebarPool.slice(0, 5).map((item) => item.title);
  const trendingNow = sidebarPool.slice(0, 3).map((item) => ({
    slug: item.slug,
    category: item.category,
    title: item.title,
    time: `${Math.max(3, Math.ceil(item.content.join(" ").split(/\s+/).filter(Boolean).length / 220))} min read`
  }));
  const blurDataURL = blurPlaceholderDataURL();

  if (!articleData) {
    notFound();
  }

  const articleUrl = `https://newtimesreporter.com/article/${articleData.slug}`;
  const contentBlocks = articleData.content
    .map((paragraph) => {
      const markdownImageMatch = paragraph.match(/^!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)$/i);
      if (markdownImageMatch) {
        return { type: "image" as const, url: markdownImageMatch[1] };
      }
      const shortcodeMatch = paragraph.match(/^\[image\](https?:\/\/.+)\[\/image\]$/i);
      if (shortcodeMatch) {
        return { type: "image" as const, url: shortcodeMatch[1].trim() };
      }
      return { type: "text" as const, text: paragraph };
    })
    .filter((block) => (block.type === "text" ? block.text.trim().length > 0 : block.url.trim().length > 0));

  const words = contentBlocks
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 220));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: articleData.title,
    image: [articleData.image],
    datePublished: articleData.publishedAtISO,
    dateModified: articleData.publishedAtISO,
    author: [
      {
        "@type": "Person",
        name: articleData.author
      }
    ],
    publisher: {
      "@type": "Organization",
      name: "New Times Reporter",
      logo: {
        "@type": "ImageObject",
        url: "https://newtimesreporter.com/logo.png"
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl
    },
    articleSection: articleData.category,
    description: articleData.seoDescription ?? articleData.content[0] ?? articleData.caption
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar tickerItems={tickerItems} />
      <FloatingShareBar title={articleData.title} url={articleUrl} />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-zinc-500">
          <Link href="/" className="hover:text-news-red">
            Home
          </Link>{" "}
          &gt;{" "}
          <Link href={`/category/${articleData.category.toLowerCase()}`} className="hover:text-news-red">
            {articleData.category}
          </Link>{" "}
          &gt; <span className="text-zinc-700">{articleData.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-3">
          <article className="lg:col-span-2">
            <h1 className="font-serif text-3xl font-bold leading-tight text-news-black sm:text-5xl">{articleData.title}</h1>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-zinc-200 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-200 font-bold text-zinc-700">
                  {articleData.author.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{articleData.author}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="text-xs text-zinc-500">{articleData.date}</p>
                    <span className="rounded-full bg-news-red/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-news-red">
                      {readingTime} min read
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[
                  {
                    Icon: Facebook,
                    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
                    label: "Share on Facebook"
                  },
                  {
                    Icon: Twitter,
                    href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(articleData.title)}`,
                    label: "Share on Twitter"
                  },
                  {
                    Icon: Linkedin,
                    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`,
                    label: "Share on LinkedIn"
                  }
                ].map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-zinc-300 p-2 text-zinc-700 transition hover:border-news-red hover:text-news-red"
                    aria-label={label}
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            <figure className="mt-8">
              <div className="relative h-[260px] overflow-hidden rounded-xl sm:h-[460px]">
                <Image
                  src={unsplashArticle(articleData.image)}
                  alt={articleData.title}
                  fill
                  placeholder="blur"
                  blurDataURL={blurDataURL}
                  unoptimized
                  priority
                  fetchPriority="high"
                  decoding="async"
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 800px"
                />
              </div>
              <figcaption className="mt-2 text-sm text-zinc-500">{articleData.caption}</figcaption>
            </figure>

            <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-4">
              <AdSenseUnit adSlot="2446135906" adFormat="fluid" adLayout="in-article" style={{ textAlign: "center" }} />
            </div>

            <div className="article-copy mt-10">
              {contentBlocks.map((block, index) =>
                block.type === "text" ? (
                  <p key={`text-${index}`}>{block.text}</p>
                ) : (
                  <figure key={`image-${index}`} className="my-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <img src={block.url} alt={`Article image ${index + 1}`} className="h-auto w-full object-cover" />
                  </figure>
                )
              )}
            </div>

            {articleData.hashtags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {articleData.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-news-red/30 bg-news-red/5 px-3 py-1 text-xs font-semibold text-news-red"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-4">
              <AdSenseUnit adSlot="7591710868" adFormat="autorelaxed" />
            </div>
          </article>

          <div>
            <Sidebar latestNews={latestNews} mostRead={mostRead} trendingNow={trendingNow} />
          </div>
        </div>
      </section>

      {relatedArticles.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-end justify-between border-b-2 border-news-black pb-2">
            <h2 className="font-serif text-xl font-bold tracking-tight text-news-black sm:text-2xl">More from New Time Reporter</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedArticles.map((item) => (
              <MustReadCard key={item.slug} article={item} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
