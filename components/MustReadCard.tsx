import Image from "next/image";
import Link from "next/link";
import { blurPlaceholderDataURL, unsplashCard } from "@/lib/images";

type Article = {
  slug: string;
  category: string;
  title: string;
  image: string;
  content: string[];
};

function deck(article: Article) {
  const raw = article.content[0] ?? "";
  return raw.length > 140 ? `${raw.slice(0, 137)}…` : raw;
}

type MustReadCardProps = {
  article: Article;
  /** First above-the-fold cards: eager + high fetch priority for LCP. */
  highPriority?: boolean;
};

export function MustReadCard({ article, highPriority = false }: MustReadCardProps) {
  const blurDataURL = blurPlaceholderDataURL();

  return (
    <article className="flex flex-col rounded-lg border border-zinc-200 bg-white">
      <Link href={`/article/${article.slug}`} className="group block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
          <Image
            src={unsplashCard(article.image)}
            alt={article.title}
            fill
            priority={highPriority}
            loading={highPriority ? undefined : "lazy"}
            decoding="async"
            placeholder="blur"
            blurDataURL={blurDataURL}
            fetchPriority={highPriority ? "high" : "low"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:opacity-95"
          />
        </div>
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <span className="mb-2 text-[11px] font-bold uppercase tracking-wider text-news-red">{article.category}</span>
          <h3 className="font-serif text-base font-bold leading-snug text-news-black group-hover:text-news-red sm:text-lg">{article.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600">{deck(article)}</p>
        </div>
      </Link>
    </article>
  );
}
