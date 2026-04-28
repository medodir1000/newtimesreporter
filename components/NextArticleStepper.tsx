"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { blurPlaceholderDataURL, unsplashHero } from "@/lib/images";

type StepperArticle = {
  slug: string;
  category: string;
  title: string;
  image: string;
};

type NextArticleStepperProps = {
  articles: StepperArticle[];
};

export function NextArticleStepper({ articles }: NextArticleStepperProps) {
  const [index, setIndex] = useState(0);
  const blurDataURL = blurPlaceholderDataURL();

  const current = useMemo(() => {
    if (articles.length === 0) return null;
    return articles[index % articles.length];
  }, [articles, index]);

  if (!current) return null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between border-b border-zinc-200 pb-2">
        <h2 className="font-serif text-lg font-bold text-news-black sm:text-xl">Next Article</h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {index + 1}/{articles.length}
        </span>
      </div>

      <span className="inline-block rounded bg-news-red/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-news-red">
        {current.category}
      </span>
      <Link href={`/article/${current.slug}`} className="mt-2 block font-serif text-2xl font-bold leading-tight text-news-black hover:text-news-red">
        {current.title}
      </Link>
      <Link href={`/article/${current.slug}`} className="mt-3 block overflow-hidden rounded-lg border border-zinc-200">
        <div className="relative aspect-[16/9] w-full bg-zinc-100">
          <Image
            src={unsplashHero(current.image)}
            alt={current.title}
            fill
            loading="lazy"
            decoding="async"
            placeholder="blur"
            blurDataURL={blurDataURL}
            fetchPriority="low"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 720px"
            className="object-cover transition duration-300 hover:scale-[1.01]"
          />
        </div>
      </Link>

      {articles.length > 1 && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % articles.length)}
            className="rounded-md bg-news-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
