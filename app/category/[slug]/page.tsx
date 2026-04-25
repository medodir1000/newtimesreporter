import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { blurPlaceholderDataURL, unsplashCard } from "@/lib/images";
import { articles, categories, tickerItems } from "@/lib/mockData";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  const blurDataURL = blurPlaceholderDataURL();

  if (!category) {
    notFound();
  }

  const categoryArticles = articles.filter((article) => article.category.toLowerCase() === category.label.toLowerCase());

  return (
    <main>
      <Navbar tickerItems={tickerItems} />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-news-red">Category</p>
            <h1 className="mt-1 font-serif text-4xl font-bold text-news-black sm:text-5xl">{category.label}</h1>
          </div>
          <p className="text-sm text-zinc-600">{categoryArticles.length} stories available</p>
        </div>

        {categoryArticles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categoryArticles.map((article, index) => (
              <article key={article.slug} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <Link href={`/article/${article.slug}`}>
                  <div className="relative h-52">
                    <Image
                      src={unsplashCard(article.image)}
                      alt={article.title}
                      fill
                      placeholder="blur"
                      blurDataURL={blurDataURL}
                      unoptimized
                      priority={index === 0}
                      fetchPriority={index === 0 ? "high" : "low"}
                      decoding="async"
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
                    />
                  </div>
                  <div className="p-5">
                    <h2 className="font-serif text-xl font-bold leading-snug text-news-black">{article.title}</h2>
                    <p className="mt-2 text-sm text-zinc-600">
                      By {article.author} - {article.date}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
            <h2 className="font-serif text-2xl font-bold text-news-black">No published stories yet</h2>
            <p className="mt-2 text-zinc-600">Our editorial team is preparing this section. Check back soon for fresh updates.</p>
            <Link href="/" className="mt-4 inline-block rounded-md bg-news-red px-5 py-2 text-sm font-semibold text-white">
              Back to Home
            </Link>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
