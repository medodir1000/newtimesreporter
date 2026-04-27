"use client";

import { useState } from "react";
import { Check, Copy, Facebook, Linkedin, MessageCircle, Twitter } from "lucide-react";

type ArticleShareInlineProps = {
  title: string;
  url: string;
};

export function ArticleShareInline({ title, url }: ArticleShareInlineProps) {
  const [copied, setCopied] = useState(false);
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const items = [
    {
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      label: "WhatsApp",
      Icon: MessageCircle
    },
    {
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      label: "Facebook",
      Icon: Facebook
    },
    {
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      label: "X (Twitter)",
      Icon: Twitter
    },
    {
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      label: "LinkedIn",
      Icon: Linkedin
    }
  ];

  return (
    <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5" aria-labelledby="share-article-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-zinc-100 pb-2">
        <h2 id="share-article-heading" className="font-serif text-lg font-bold text-news-black sm:text-xl">
          Share this article
        </h2>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-news-red hover:text-news-red"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="mb-4 text-sm text-zinc-600">Send the story to readers on social or messengers.</p>
      <div className="flex flex-wrap gap-2">
        {items.map(({ href, label, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-news-red hover:bg-white hover:text-news-red"
          >
            <Icon size={18} className="shrink-0" aria-hidden />
            {label}
          </a>
        ))}
      </div>
    </section>
  );
}
