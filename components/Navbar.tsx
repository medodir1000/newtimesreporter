"use client";

import { useState } from "react";
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Menu, Search, Twitter, X } from "lucide-react";
import useSWR from "swr";
import { categories } from "@/lib/mockData";
import { NewsTicker } from "./NewsTicker";
import { Logo } from "./Logo";

type NavbarProps = {
  tickerItems: string[];
};

type TickerApiResponse = {
  items?: string[];
};

const socialLinks = [
  {
    Icon: Facebook,
    href: "https://www.facebook.com/profile.php?id=61588801507310",
    label: "Facebook"
  },
  {
    Icon: Twitter,
    href: "#",
    label: "X"
  },
  {
    Icon: Linkedin,
    href: "#",
    label: "LinkedIn"
  },
  {
    Icon: Instagram,
    href: "#",
    label: "Instagram"
  }
];

const fetcher = async (url: string): Promise<TickerApiResponse> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Ticker request failed");
  }
  return response.json() as Promise<TickerApiResponse>;
};

export function Navbar({ tickerItems }: NavbarProps) {
  const [openMenu, setOpenMenu] = useState(false);
  const { data } = useSWR("/api/ticker", fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });
  const liveTickerItems = data?.items && data.items.length > 0 ? data.items : tickerItems;

  return (
    <header className="border-b border-zinc-200">
      <div className="bg-news-black">
        <div className="mx-auto flex max-w-[86rem] items-center justify-between gap-3 px-3 py-1.5 sm:gap-4 sm:px-6 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 bg-news-red px-2 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              Latest News
            </span>
            <div className="min-w-0">
              <NewsTicker items={liveTickerItems} />
            </div>
          </div>
          <div className="hidden items-center gap-3 text-zinc-200 sm:flex">
            {socialLinks.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-1.5 transition-transform hover:-translate-y-0.5 hover:bg-zinc-800"
                aria-label={label}
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[86rem] px-3 py-2.5 sm:px-6 sm:py-4 lg:px-6">
        <div className="mb-2.5 flex items-center justify-between sm:mb-3">
          <Logo />
          <button
            type="button"
            className="rounded-md border border-zinc-300 p-2 text-zinc-700 lg:hidden"
            onClick={() => setOpenMenu((prev) => !prev)}
            aria-label={openMenu ? "close menu" : "open menu"}
          >
            {openMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <div className="hidden items-center justify-between border-t border-zinc-200 pt-3 lg:flex">
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
            <Link href="/" className="hover:text-news-red">
              Home
            </Link>
            {categories.map((item) => (
              <Link key={item.slug} href={`/category/${item.slug}`} className="hover:text-news-red">
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            className="rounded-full border border-zinc-300 p-2 text-zinc-700 transition hover:border-news-red hover:text-news-red"
            aria-label="search"
          >
            <Search size={18} />
          </button>
        </div>
        {openMenu && (
          <div className="space-y-3 border-t border-zinc-200 pt-4 lg:hidden">
            <nav className="grid grid-cols-2 gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
              <Link
                href="/"
                className="rounded-md border border-zinc-200 px-3 py-2 hover:border-news-red hover:text-news-red"
                onClick={() => setOpenMenu(false)}
              >
                Home
              </Link>
              {categories.map((item) => (
                <Link
                  key={item.slug}
                  href={`/category/${item.slug}`}
                  className="rounded-md border border-zinc-200 px-3 py-2 hover:border-news-red hover:text-news-red"
                  onClick={() => setOpenMenu(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-600">
                {socialLinks.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-zinc-300 p-2 hover:border-news-red hover:text-news-red"
                    aria-label={label}
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
              <button
                type="button"
                className="rounded-full border border-zinc-300 p-2 text-zinc-700 transition hover:border-news-red hover:text-news-red"
                aria-label="search"
              >
                <Search size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
