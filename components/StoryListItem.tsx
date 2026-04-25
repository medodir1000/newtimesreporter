import Image from "next/image";
import Link from "next/link";
import { blurPlaceholderDataURL, unsplashRow, unsplashThumb } from "@/lib/images";

type StoryListItemProps = {
  slug: string;
  title: string;
  category: string;
  image: string;
  meta: string;
  compact?: boolean;
};

export function StoryListItem({ slug, title, category, image, meta, compact = false }: StoryListItemProps) {
  const src = compact ? unsplashThumb(image) : unsplashRow(image);
  const w = compact ? 88 : 108;
  const h = compact ? 64 : 78;
  const blurDataURL = blurPlaceholderDataURL();

  return (
    <article className={`flex gap-3 sm:gap-4 border-b border-zinc-100 last:border-b-0 ${compact ? "py-3" : "py-4"}`}>
      <Link
        href={`/article/${slug}`}
        className="relative shrink-0 overflow-hidden rounded bg-zinc-100"
        style={{ width: w, height: h }}
        aria-label={title}
      >
        <Image src={src} alt="" fill unoptimized placeholder="blur" blurDataURL={blurDataURL} sizes={`${w}px`} className="object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/article/${slug}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-news-red">{category}</span>
          <h3 className={`mt-1 font-semibold leading-snug text-news-black hover:text-news-red ${compact ? "text-sm" : "text-sm sm:text-base"}`}>
            {title}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-zinc-500">{meta}</p>
      </div>
    </article>
  );
}
