import { ArticleCard } from "@/components/ArticleCard";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { Footer } from "@/components/Footer";
import { MustReadCard } from "@/components/MustReadCard";
import { Navbar } from "@/components/Navbar";
import { QuickLinksRow } from "@/components/QuickLinksRow";
import { Sidebar } from "@/components/Sidebar";
import { StoryListItem } from "@/components/StoryListItem";
import { getHomepageArticles } from "@/lib/articles";
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

export default async function HomePage() {
  const homepageArticles = await getHomepageArticles(30);
  const heroStory = homepageArticles[0];
  const pool = homepageArticles.slice(1);
  const mustRead = pool.slice(0, 3);
  const moreStories = pool.slice(3, 9);
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

  const mainStorySlugs = new Set([
    heroStory.slug,
    ...mustRead.map((a) => a.slug),
    ...moreStories.map((a) => a.slug)
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
