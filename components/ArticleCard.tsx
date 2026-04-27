import Image from "next/image";
import Link from "next/link";
import { blurPlaceholderDataURL, unsplashCard, unsplashHero } from "@/lib/images";

type ArticleCardProps = {
  category: string;
  title: string;
  image: string;
  time: string;
  excerpt?: string;
  href?: string;
  large?: boolean;
  priority?: boolean;
};

export function ArticleCard({
  category,
  title,
  image,
  time,
  excerpt,
  href = "/article/coalition-unveils-package",
  large = false,
  priority = false
}: ArticleCardProps) {
  const optimizedSrc = large ? unsplashHero(image) : unsplashCard(image);
  const blurDataURL = blurPlaceholderDataURL();

  return (
    <article
      className={`group overflow-hidden rounded-xl border border-zinc-200 bg-white`}
    >
      <Link href={href}>
        <div className={`relative ${large ? "h-56 sm:h-[420px]" : "h-48"}`}>
          <Image
            src={optimizedSrc}
            alt={title}
            fill
            placeholder="blur"
            blurDataURL={blurDataURL}
            priority={priority}
            fetchPriority={priority ? "high" : "low"}
            unoptimized
            decoding="async"
            sizes={
              large
                ? "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 720px"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            }
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        </div>

        <div className={`${large ? "p-4 sm:p-6" : "p-4 sm:p-5"}`}>
          <span className="mb-3 inline-block bg-news-red px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            {category}
          </span>
          <h3
            className={`${large ? "font-serif text-2xl font-bold leading-tight text-news-black sm:text-3xl" : "font-serif text-lg font-bold leading-snug text-news-black sm:text-xl"}`}
          >
            {title}
          </h3>
          {excerpt && (
            <p className={`${large ? "mt-3 text-sm text-zinc-700 sm:text-base" : "mt-3 text-sm text-zinc-600"}`}>{excerpt}</p>
          )}
          <p className={`${large ? "mt-4 text-sm text-zinc-500" : "mt-4 text-sm text-zinc-500"}`}>{time}</p>
        </div>
      </Link>
    </article>
  );
}
