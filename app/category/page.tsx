import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { categories, tickerItems } from "@/lib/mockData";

export default function CategoriesPage() {
  return (
    <main>
      <Navbar tickerItems={tickerItems} />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-bold text-news-black sm:text-5xl">Browse Categories</h1>
        <p className="mt-3 text-zinc-600">Choose a section to read focused coverage and latest stories.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((item) => (
            <Link
              key={item.slug}
              href={`/category/${item.slug}`}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-4 font-semibold text-zinc-800 transition hover:border-news-red hover:text-news-red"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
