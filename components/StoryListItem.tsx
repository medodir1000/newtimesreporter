import Image from "next/image";
import Link from "next/link";
import { blurPlaceholderDataURL, unsplashListFeatured, unsplashRow, unsplashThumb } from "@/lib/images";

type StoryListItemProps = {
  slug: string;
  title: string;
  category: string;
  image: string;
  meta: string;
  compact?: boolean;
  /** Wide list row with a large thumbnail (e.g. home “All stories”). */
  featuredThumb?: boolean;
};

export function StoryListItem({
  slug,
  title,
  category,
  image,
  meta,
  compact = false,
  featuredThumb = false
}: StoryListItemProps) {
  const blurDataURL = blurPlaceholderDataURL();

  const tight = compact && !featuredThumb;
  const src = featuredThumb ? unsplashListFeatured(image) : tight ? unsplashThumb(image) : unsplashRow(image);
  const w = tight ? 88 : 108;

  const titleClass = featuredThumb
    ? "mt-1 text-sm font-semibold leading-snug text-news-black hover:text-news-red sm:text-base"
    : tight
      ? "mt-1 text-sm font-semibold leading-snug text-news-black hover:text-news-red"
      : "mt-1 text-sm font-semibold leading-snug text-news-black hover:text-news-red sm:text-base";

  return (
    <article
      className={`flex border-b border-zinc-100 last:border-b-0 ${featuredThumb ? "gap-4 py-4 sm:gap-5 sm:py-5" : tight ? "gap-3 py-3 sm:gap-4" : "gap-3 py-4 sm:gap-4"}`}
    >
      <Link
        href={`/article/${slug}`}
        className={
          featuredThumb
            ? "relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-100 sm:w-32 md:w-36"
            : `relative aspect-[4/3] shrink-0 overflow-hidden rounded bg-zinc-100 ${tight ? "w-[88px]" : "w-[108px]"}`
        }
        aria-label={title}
      >
        <Image
          src={src}
          alt=""
          fill
          loading="lazy"
          decoding="async"
          placeholder="blur"
          blurDataURL={blurDataURL}
          fetchPriority="low"
          sizes={featuredThumb ? "(max-width: 640px) 112px, (max-width: 768px) 128px, 144px" : `${w}px`}
          className="object-cover"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/article/${slug}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-news-red">{category}</span>
          <h3 className={titleClass}>{title}</h3>
        </Link>
        <p className="mt-1 text-xs text-zinc-500 sm:text-sm">{meta}</p>
      </div>
    </article>
  );
}
