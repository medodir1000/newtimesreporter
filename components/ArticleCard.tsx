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
      className={`group overflow-hidden rounded-xl ${large ? "relative min-h-[270px] sm:min-h-[460px]" : "border border-zinc-200 bg-white"}`}
    >
      <Link href={href}>
        <div className={`${large ? "absolute inset-0" : "relative h-48"}`}>
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
          {large && <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />}
        </div>

        <div className={`${large ? "absolute bottom-0 p-4 text-white sm:p-8" : "p-4 sm:p-5"}`}>
          <span className="mb-3 inline-block bg-news-red px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            {category}
          </span>
          <h3
            className={`${large ? "font-serif text-xl font-bold leading-tight sm:text-3xl" : "font-serif text-lg font-bold leading-snug text-news-black sm:text-xl"}`}
          >
            {title}
          </h3>
          {excerpt && (
            <p className={`${large ? "mt-3 text-sm text-zinc-100/90 sm:text-base" : "mt-3 text-sm text-zinc-600"}`}>{excerpt}</p>
          )}
          <p className={`${large ? "mt-4 text-sm text-zinc-200" : "mt-4 text-sm text-zinc-500"}`}>{time}</p>
        </div>
      </Link>
    </article>
  );
}
