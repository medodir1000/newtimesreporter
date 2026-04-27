import Image from "next/image";
import Link from "next/link";
import { blurPlaceholderDataURL, unsplashThumb } from "@/lib/images";
import { AdSenseUnit } from "./AdSenseUnit";

type LatestNewsItem = {
  slug: string;
  title: string;
  image: string;
  time: string;
  category?: string;
};

type TrendingItem = {
  slug: string;
  category: string;
  title: string;
  time: string;
};

type SidebarProps = {
  latestNews: LatestNewsItem[];
  mostRead: string[];
  trendingNow: TrendingItem[];
};

export function Sidebar({ latestNews, mostRead, trendingNow }: SidebarProps) {
  const blurDataURL = blurPlaceholderDataURL();

  return (
    <aside className="space-y-5 sm:space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-xl font-bold text-news-black">Latest News</h2>
        <div className="space-y-4">
          {latestNews.map((item, index) => (
            <article key={item.slug || `${item.title}-${index}`} className="flex gap-3 border-b border-zinc-100 pb-4 last:border-b-0 last:pb-0">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded">
                <Image
                  src={unsplashThumb(item.image)}
                  alt={item.title}
                  fill
                  placeholder="blur"
                  blurDataURL={blurDataURL}
                  sizes="112px"
                  unoptimized
                  decoding="async"
                  fetchPriority={index === 0 ? "auto" : "low"}
                  className="object-cover"
                />
              </div>
              <div>
                {item.category && (
                  <span className="inline-block rounded bg-news-red/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-news-red">
                    {item.category}
                  </span>
                )}
                <Link href={`/article/${item.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-800 hover:text-news-red">
                  {item.title}
                </Link>
                <p className="mt-1 text-xs text-zinc-500">{item.time}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-xl font-bold text-news-black">Most Read</h2>
        <ol className="space-y-3">
          {mostRead.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-3">
              <span className="w-5 font-serif text-xl font-bold text-news-red">{index + 1}</span>
              <span className="text-sm font-semibold text-zinc-800">{item}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-xl font-bold text-news-black">Trending Now</h2>
        <div className="space-y-4">
          {trendingNow.map((item, index) => (
            <article key={item.slug || `${item.title}-${index}`}>
              <span className="inline-block bg-news-red/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-news-red">
                {item.category}
              </span>
              <Link href={`/article/${item.slug}`} className="mt-2 block text-sm font-semibold leading-snug text-zinc-800 hover:text-news-red">
                {item.title}
              </Link>
              <p className="mt-1 text-xs text-zinc-500">{item.time}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-news-red p-4 sm:p-5 text-white">
        <h2 className="text-xl font-bold">Newsletter</h2>
        <p className="mt-2 text-sm text-red-100">Get top stories and analysis in your inbox every morning.</p>
        <form className="mt-4 space-y-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full rounded-md border border-white/30 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-news-black/30"
          />
          <button
            type="submit"
            className="w-full rounded-md border border-white bg-news-black px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-zinc-900"
          >
            Subscribe
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
        <AdSenseUnit adSlot="7347108795" adFormat="fluid" adLayoutKey="-6t+ed+2i-1n-4w" />
      </section>
    </aside>
  );
}
