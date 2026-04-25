import { ArticleCard } from "@/components/ArticleCard";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { Footer } from "@/components/Footer";
import { MustReadCard } from "@/components/MustReadCard";
import { Navbar } from "@/components/Navbar";
import { QuickLinksRow } from "@/components/QuickLinksRow";
import { Sidebar } from "@/components/Sidebar";
import { StoryListItem } from "@/components/StoryListItem";
import { articles, heroStory, homeQuickLinks, latestNews, mostRead, tickerItems, trendingNow } from "@/lib/mockData";

export default function HomePage() {
  const pool = articles.filter((article) => article.slug !== heroStory.slug);
  const mustRead = pool.slice(0, 3);
  const moreStories = pool.slice(3, 9);
  const mid = Math.ceil(moreStories.length / 2);
  const moreLeft = moreStories.slice(0, mid);
  const moreRight = moreStories.slice(mid);

  const mainStorySlugs = new Set([
    heroStory.slug,
    ...mustRead.map((a) => a.slug),
    ...moreStories.map((a) => a.slug)
  ]);

  const newsFromTrending = trendingNow
    .map((item) => {
      const article = articles.find((a) => a.slug === item.slug);
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
      category: articles.find((a) => a.slug === item.slug)?.category ?? "News",
      image: item.image,
      meta: item.time
    }));

  const newsRows = [
    ...newsFromTrending,
    ...wireNews.filter((row) => !newsFromTrending.some((t) => t.slug === row.slug))
  ];

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
            time={heroStory.time}
            excerpt={heroStory.excerpt}
            href={`/article/${heroStory.slug}`}
            large
            priority
          />

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

          <div>
            <div className="mb-4 flex items-end justify-between border-b-2 border-news-black pb-2">
              <h2 className="font-serif text-xl font-bold tracking-tight text-news-black sm:text-2xl">News</h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Latest wire</span>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white px-3">
              {newsRows.map((item) => (
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
        </div>

        <div className="lg:pl-1">
          <Sidebar latestNews={latestNews} mostRead={mostRead} trendingNow={trendingNow} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
