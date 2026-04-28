import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Facebook, Linkedin, Twitter } from "lucide-react";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { ArticleViewTracker } from "@/components/ArticleViewTracker";
import { Footer } from "@/components/Footer";
import { ArticleComments } from "@/components/ArticleComments";
import { ArticleNewsJsonLd } from "@/components/ArticleNewsJsonLd";
import { ArticleShareInline } from "@/components/ArticleShareInline";
import { FloatingShareBar } from "@/components/FloatingShareBar";
import { MustReadCard } from "@/components/MustReadCard";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { articleImageUrl, blurPlaceholderDataURL, imgPreset, unsplashArticle, unsplashThumb } from "@/lib/images";
import { getAuthorProfile } from "@/lib/authors";
import { getArticleBySlug, getHomepageArticles, getRelatedArticles } from "@/lib/articles";
import { categorySlugFromLabel } from "@/lib/categorySlug";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
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
      title: `Article Not Found | ${SITE_NAME}`,
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

  const articleUrl = `${getSiteUrl()}/article/${articleData.slug}`;
  const noisyParagraphPatterns = [
    /^\s*here(?:'s| is)\b/i,
    /^\s*output strict json\b/i,
    /^\s*json schema\b/i,
    /^\s*requirements?:\b/i,
    /^\s*input headline:\b/i,
    /^\s*input summary:\b/i,
    /^\s*source url:\b/i,
    /^\s*published at:\b/i,
    /^\s*إليك\b/i
  ];

  const parsedBlocks = articleData.content
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
    .filter((block) => {
      if (block.type === "image") return block.url.trim().length > 0;
      const text = block.text.trim();
      if (!text) return false;
      return !noisyParagraphPatterns.some((pattern) => pattern.test(text));
    });

  const distributeTrailingImages = (
    blocks: Array<{ type: "text"; text: string } | { type: "image"; url: string }>
  ) => {
    if (blocks.length < 4) return blocks;

    let firstTrailingImageIndex = -1;
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].type === "image") {
        firstTrailingImageIndex = i;
      } else {
        break;
      }
    }

    if (firstTrailingImageIndex === -1) return blocks;

    const headBlocks = blocks.slice(0, firstTrailingImageIndex);
    const trailingImages = blocks.slice(firstTrailingImageIndex).filter((b) => b.type === "image");

    // Rebalance only when all trailing blocks are images and there are multiple of them.
    if (trailingImages.length < 2 || headBlocks.some((b) => b.type === "image")) return blocks;

    const textBlocks = headBlocks.filter((b) => b.type === "text");
    if (textBlocks.length < 3) return blocks;

    const interval = Math.max(1, Math.floor(textBlocks.length / (trailingImages.length + 1)));
    const result: Array<{ type: "text"; text: string } | { type: "image"; url: string }> = [];
    let imageCursor = 0;

    textBlocks.forEach((textBlock, index) => {
      result.push(textBlock);
      const shouldInsertImage =
        imageCursor < trailingImages.length && (index + 1) % interval === 0 && index < textBlocks.length - 1;
      if (shouldInsertImage) {
        result.push(trailingImages[imageCursor]);
        imageCursor += 1;
      }
    });

    while (imageCursor < trailingImages.length) {
      const insertAt = Math.max(1, result.length - 1);
      result.splice(insertAt, 0, trailingImages[imageCursor]);
      imageCursor += 1;
    }

    return result;
  };

  const contentBlocks = distributeTrailingImages(parsedBlocks);

  const words = contentBlocks
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 220));
  const authorProfile = getAuthorProfile(articleData.author);
  const publisherLogoUrl = `${getSiteUrl()}/icon.svg`;

  return (
    <main>
      <ArticleNewsJsonLd
        article={articleData}
        articleUrl={articleUrl}
        siteName={SITE_NAME}
        publisherLogoUrl={publisherLogoUrl}
      />
      <ArticleViewTracker slug={articleData.slug} />
      <Navbar tickerItems={tickerItems} />
      <FloatingShareBar title={articleData.title} url={articleUrl} />

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <nav className="mb-5 truncate text-xs text-zinc-500 sm:mb-6 sm:text-sm">
          <Link href="/" className="hover:text-news-red">
            Home
          </Link>{" "}
          &gt;{" "}
          <Link href={`/category/${categorySlugFromLabel(articleData.category)}`} className="hover:text-news-red">
            {articleData.category}
          </Link>{" "}
          &gt; <span className="text-zinc-700">{articleData.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
          <article className="min-w-0 lg:col-span-2">
            <h1 className="break-words font-serif text-[1.95rem] font-bold leading-tight text-news-black sm:text-4xl lg:text-5xl">
              {articleData.title}
            </h1>

            <div className="mt-5 flex flex-col gap-3 border-y border-zinc-200 py-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative aspect-square h-11 w-11 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                  <Image
                    src={unsplashThumb(authorProfile.photo)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{authorProfile.name}</p>
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

            <figure className="mt-6 sm:mt-8">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-100 sm:aspect-[2/1]">
                <Image
                  src={unsplashArticle(articleData.image)}
                  alt={articleData.title}
                  fill
                  placeholder="blur"
                  blurDataURL={blurDataURL}
                  priority
                  fetchPriority="high"
                  decoding="async"
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 900px"
                />
              </div>
              <figcaption className="mt-2 break-words text-sm text-zinc-500">{articleData.caption}</figcaption>
            </figure>

            <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white p-3 sm:mt-8 sm:p-4">
              <AdSenseUnit adSlot="2446135906" adFormat="fluid" adLayout="in-article" style={{ textAlign: "center" }} />
            </div>

            <div className="article-copy mt-7 sm:mt-10">
              {contentBlocks.map((block, index) =>
                block.type === "text" ? (
                  <p key={`text-${index}`}>{block.text}</p>
                ) : (
                  <figure
                    key={`image-${index}`}
                    className="relative my-8 aspect-[16/9] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
                  >
                    <Image
                      src={articleImageUrl(block.url, imgPreset.articleLead)}
                      alt={`Article image ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 800px"
                      placeholder="blur"
                      blurDataURL={blurDataURL}
                      loading="lazy"
                      decoding="async"
                      className="object-cover"
                    />
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

            <ArticleShareInline title={articleData.title} url={articleUrl} />
            <ArticleComments slug={articleData.slug} />

            <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-start gap-3">
                <div className="relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                  <Image
                    src={unsplashThumb(authorProfile.photo)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-news-black">{authorProfile.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">{authorProfile.bio}</p>
                  {authorProfile.website && (
                    <a
                      href={authorProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-semibold text-news-red hover:underline"
                    >
                      {authorProfile.website}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4">
              <AdSenseUnit adSlot="7591710868" adFormat="autorelaxed" />
            </div>
          </article>

          <div className="min-w-0">
            <Sidebar latestNews={latestNews} mostRead={mostRead} trendingNow={trendingNow} />
          </div>
        </div>
      </section>

      {relatedArticles.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-end justify-between border-b-2 border-news-black pb-2">
            <h2 className="font-serif text-xl font-bold tracking-tight text-news-black sm:text-2xl">More from {SITE_NAME}</h2>
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
