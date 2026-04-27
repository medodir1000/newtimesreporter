import { ArticleCard } from "@/components/ArticleCard";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { Footer } from "@/components/Footer";
import { MustReadCard } from "@/components/MustReadCard";
import { Navbar } from "@/components/Navbar";
import { NextArticleStepper } from "@/components/NextArticleStepper";
import { QuickLinksRow } from "@/components/QuickLinksRow";
import { Sidebar } from "@/components/Sidebar";
import { StoryListItem } from "@/components/StoryListItem";
import { getHomepageArticles } from "@/lib/articles";
import { categorySlugFromLabel } from "@/lib/categorySlug";
import { homeQuickLinks, tickerItems } from "@/lib/mockData";

export const dynamic = "force-dynamic";

function timeAgo(iso: string) {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(deltaMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Supabase/PostgREST commonly allows up to ~1000 rows per request. */
const HOME_FEED_LIMIT = 1000;

export default async function HomePage() {
  const homepageArticles = await getHomepageArticles(HOME_FEED_LIMIT);
  const heroStory = homepageArticles[0];
  const pool = homepageArticles.slice(1);
  const mustRead = pool.slice(0, 3);
  const moreStoriesPrimary = pool.slice(3, 15);
  const moreStoriesFallback = pool.slice(0, 12);
  const moreStories = (moreStoriesPrimary.length >= 6 ? moreStoriesPrimary : moreStoriesFallback).filter(
    (article, index, arr) => arr.findIndex((item) => item.slug === article.slug) === index
  );
  const mid = Math.ceil(moreStories.length / 2);
  const moreLeft = moreStories.slice(0, mid);
  const moreRight = moreStories.slice(mid);

  const latestNews = pool.slice(0, 3).map((item) => ({
    slug: item.slug,
    category: item.category,
    title: item.title,
    image: item.image,
    time: timeAgo(item.publishedAtISO)
  }));

  const trendingNow = pool.slice(0, 3).map((item) => ({
    slug: item.slug,
    category: item.category,
    title: item.title,
    time: `${Math.max(3, Math.ceil(item.content.join(" ").split(/\s+/).filter(Boolean).length / 220))} min read`
  }));

  const mostRead = pool.slice(0, 5).map((item) => item.title);

  if (!heroStory) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-news-black">No Articles Yet</h1>
      </main>
    );
  }

  const usedAfterMore = new Set([
    heroStory.slug,
    ...mustRead.map((a) => a.slug),
    ...moreStories.map((a) => a.slug)
  ]);
  const restPool = pool.filter((a) => !usedAfterMore.has(a.slug));
  const nextArticleCandidates = restPool.slice(0, 12).map((item) => ({
    slug: item.slug,
    category: item.category,
    title: item.title,
    image: item.image
  }));
  const spotlightArticles = restPool.slice(12, 15);
  const dayBriefArticles = restPool.slice(15, 25);
  const wireFeedArticles = restPool.slice(25, 35);

  const mainStorySlugs = new Set([
    heroStory.slug,
    ...mustRead.map((a) => a.slug),
    ...moreStories.map((a) => a.slug),
    ...restPool.slice(0, 25).map((a) => a.slug)
  ]);

  const newsFromTrending = trendingNow
    .map((item) => {
      const article = homepageArticles.find((a) => a.slug === item.slug);
      if (!article || mainStorySlugs.has(item.slug)) return null;
      return {
        slug: article.slug,
        title: article.title,
        category: article.category,
        image: article.image,
        meta: `${article.category} · ${item.time}`
      };
    })
    .filter(Boolean) as { slug: string; title: string; category: string; image: string; meta: string }[];

  const wireNews = latestNews
    .filter((item) => !mainStorySlugs.has(item.slug))
    .map((item) => ({
      slug: item.slug,
      title: item.title,
      category: homepageArticles.find((a) => a.slug === item.slug)?.category ?? "News",
      image: item.image,
      meta: item.time
    }));

  const newsRows = [
    ...newsFromTrending,
    ...wireNews.filter((row) => !newsFromTrending.some((t) => t.slug === row.slug))
  ];
  const wireFromFeed = wireFeedArticles.map((item) => ({
    slug: item.slug,
    title: item.title,
    category: item.category,
    image: item.image,
    meta: timeAgo(item.publishedAtISO)
  }));
  const newsRowsWithFallback =
    newsRows.length > 0
      ? newsRows
      : wireFromFeed.length >= 4
        ? wireFromFeed
        : pool
            .filter((item) => !mainStorySlugs.has(item.slug))
            .slice(0, 10)
            .map((item) => ({
              slug: item.slug,
              title: item.title,
              category: item.category,
              image: item.image,
              meta: timeAgo(item.publishedAtISO)
            }));
  const categorySections = Array.from(
    homepageArticles.reduce((map, article) => {
      const key = article.category || "News";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(article);
      return map;
    }, new Map<string, typeof homepageArticles>())
  )
    .map(([label, items]) => ({
      label,
      slug: categorySlugFromLabel(label),
      items
    }));

  const displayNewsRows =
    newsRowsWithFallback.length >= 8 ? newsRowsWithFallback : [...newsRowsWithFallback, ...wireFromFeed].filter(
      (row, index, arr) => arr.findIndex((r) => r.slug === row.slug) === index
    );

  return (
    <main>
      <Navbar tickerItems={tickerItems} />

      <section className="mx-auto grid max-w-7xl gap-5 px-3 py-5 sm:px-5 sm:py-8 lg:grid-cols-3 lg:gap-8 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-8 sm:gap-10 lg:col-span-2">
          <div>
            <div className="mb-4 flex items-end justify-between border-b-2 border-news-black pb-2">
              <h2 className="font-serif text-xl font-bold tracking-tight text-news-black sm:text-2xl">Must Read</h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-news-red">Today</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mustRead.map((article) => (
                <MustReadCard key={article.slug} article={article} />
              ))}
            </div>
          </div>

          <ArticleCard
            category={heroStory.category}
            title={heroStory.title}
            image={heroStory.image}
            time={timeAgo(heroStory.publishedAtISO)}
            excerpt={heroStory.content[0] ?? ""}
            href={`/article/${heroStory.slug}`}
            large
            priority
          />

          <NextArticleStepper articles={nextArticleCandidates} />

          <QuickLinksRow items={homeQuickLinks} />

          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3">
            <AdSenseUnit adSlot="5886167944" adFormat="auto" fullWidthResponsive />
          </div>

          <div>
            <div className="mb-4 flex items-end justify-between border-b-2 border-news-black pb-2">
              <h2 className="font-serif text-xl font-bold tracking-tight text-news-black sm:text-2xl">More Stories</h2>
            </div>
            <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
              <div className="divide-y divide-zinc-100">
                {moreLeft.map((article) => (
                  <StoryListItem
                    key={article.slug}
                    slug={article.slug}
                    title={article.title}
                    category={article.category}
                    image={article.image}
                    meta={article.date}
                  />
                ))}
              </div>
              <div className="divide-y divide-zinc-100 md:border-l md:border-zinc-100 md:pl-8">
                {moreRight.map((article) => (
                  <StoryListItem
                    key={article.slug}
                    slug={article.slug}
                    title={article.title}
                    category={article.category}
                    image={article.image}
                    meta={article.date}
                  />
                ))}
              </div>
            </div>
          </div>

          {spotlightArticles.length > 0 && (
            <div>
              <div className="mb-4 flex items-end justify-between border-b-2 border-news-black pb-2">
                <h2 className="font-serif text-xl font-bold tracking-tight text-news-black sm:text-2xl">Editor&apos;s picks</h2>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Spotlight</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {spotlightArticles.map((article) => (
                  <ArticleCard
                    key={article.slug}
                    category={article.category}
                    title={article.title}
                    image={article.image}
                    time={timeAgo(article.publishedAtISO)}
                    excerpt={article.content[0] ?? ""}
                    href={`/article/${article.slug}`}
                  />
                ))}
              </div>
            </div>
          )}

          {dayBriefArticles.length > 0 && (
            <div>
              <div className="mb-4 flex items-end justify-between border-b-2 border-news-black pb-2">
                <h2 className="font-serif text-xl font-bold tracking-tight text-news-black sm:text-2xl">Day in brief</h2>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Quick reads</span>
              </div>
              <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white px-3">
                {dayBriefArticles.map((article) => (
                  <StoryListItem
                    key={article.slug}
                    slug={article.slug}
                    title={article.title}
                    category={article.category}
                    image={article.image}
                    meta={timeAgo(article.publishedAtISO)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-4 flex items-end justify-between border-b-2 border-news-black pb-2">
              <h2 className="font-serif text-xl font-bold tracking-tight text-news-black sm:text-2xl">News</h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Latest wire</span>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white px-3">
              {displayNewsRows.map((item) => (
                <StoryListItem
                  key={item.slug}
                  slug={item.slug}
                  title={item.title}
                  category={item.category}
                  image={item.image}
                  meta={item.meta}
                  compact
                />
              ))}
            </div>
          </div>

          {categorySections.length > 0 && (
            <div>
              <div className="mb-4 flex items-end justify-between border-b-2 border-news-black pb-2">
                <h2 className="font-serif text-xl font-bold tracking-tight text-news-black sm:text-2xl">More News</h2>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">By category</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {categorySections.map((section) => (
                  <section key={section.slug} className="rounded-xl border border-zinc-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-serif text-lg font-bold text-news-black">{section.label}</h3>
                      <a
                        href={`/category/${section.slug}`}
                        className="text-xs font-semibold uppercase tracking-wide text-news-red hover:underline"
                      >
                        View all
                      </a>
                    </div>
                    <div className="space-y-3">
                      {section.items.map((item) => (
                        <a
                          key={item.slug}
                          href={`/article/${item.slug}`}
                          className="block border-b border-zinc-100 pb-3 text-sm font-semibold leading-snug text-zinc-800 last:border-b-0 last:pb-0 hover:text-news-red"
                        >
                          {item.title}
                        </a>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}

          {homepageArticles.length > 0 && (
            <div>
              <div className="mb-4 flex items-end justify-between border-b-2 border-news-black pb-2">
                <h2 className="font-serif text-xl font-bold tracking-tight text-news-black sm:text-2xl">All stories</h2>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {homepageArticles.length} article{homepageArticles.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid gap-x-8 gap-y-0 rounded-xl border border-zinc-200 bg-white px-3 md:grid-cols-2">
                <div className="divide-y divide-zinc-100 md:pr-4">
                  {homepageArticles
                    .filter((_, i) => i % 2 === 0)
                    .map((article) => (
                      <StoryListItem
                        key={article.slug}
                        slug={article.slug}
                        title={article.title}
                        category={article.category}
                        image={article.image}
                        meta={timeAgo(article.publishedAtISO)}
                        featuredThumb
                      />
                    ))}
                </div>
                <div className="divide-y divide-zinc-100 md:border-l md:border-zinc-100 md:pl-4">
                  {homepageArticles
                    .filter((_, i) => i % 2 === 1)
                    .map((article) => (
                      <StoryListItem
                        key={article.slug}
                        slug={article.slug}
                        title={article.title}
                        category={article.category}
                        image={article.image}
                        meta={timeAgo(article.publishedAtISO)}
                        featuredThumb
                      />
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:pl-1">
          <Sidebar latestNews={latestNews} mostRead={mostRead} trendingNow={trendingNow} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
