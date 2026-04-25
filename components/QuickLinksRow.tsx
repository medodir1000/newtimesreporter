import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type QuickLinkItem = {
  title: string;
  description: string;
  href: string;
};

export function QuickLinksRow({ items }: { items: QuickLinkItem[] }) {
  return (
    <div className="grid gap-3 border-y border-zinc-200 py-5 sm:grid-cols-3 sm:gap-6 sm:py-6">
      {items.map((item) => (
        <Link key={item.title} href={item.href} className="group flex gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 sm:p-4 transition hover:border-news-red/40 hover:bg-white">
          <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-news-red transition group-hover:translate-x-0.5" aria-hidden />
          <div>
            <p className="font-semibold text-news-black group-hover:text-news-red">{item.title}</p>
            <p className="mt-1 text-sm leading-snug text-zinc-600">{item.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
