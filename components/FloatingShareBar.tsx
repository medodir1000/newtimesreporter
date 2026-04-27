"use client";

import { Facebook, MessageCircle, Twitter } from "lucide-react";

type FloatingShareBarProps = {
  title: string;
  url: string;
};

export function FloatingShareBar({ title, url }: FloatingShareBarProps) {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const links = [
    {
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      label: "Share on WhatsApp",
      icon: MessageCircle
    },
    {
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      label: "Share on Facebook",
      icon: Facebook
    },
    {
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      label: "Share on X",
      icon: Twitter
    }
  ];

  return (
    <div className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-full border border-zinc-200 bg-white/95 px-2 py-1 shadow-lg backdrop-blur sm:bottom-5 lg:left-auto lg:right-5 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0 lg:rounded-xl lg:px-2 lg:py-2">
      <div className="flex items-center gap-1 lg:flex-col lg:gap-2">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              className="rounded-full border border-zinc-200 bg-white p-1.5 text-zinc-700 transition hover:border-news-red hover:text-news-red sm:p-2"
            >
              <Icon size={14} />
            </a>
          );
        })}
      </div>
    </div>
  );
}
