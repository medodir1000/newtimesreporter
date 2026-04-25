import Link from "next/link";
import { redirect } from "next/navigation";
import { articles } from "@/lib/mockData";

export default function ArticleIndexPage() {
  if (articles.length > 0) {
    redirect(`/article/${articles[0].slug}`);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 text-center">
      <h1 className="font-serif text-3xl font-bold text-news-black">No Articles Yet</h1>
      <p className="mt-3 text-zinc-600">Please add stories to continue.</p>
      <Link href="/" className="mt-6 inline-block rounded-md bg-news-red px-5 py-2 text-sm font-semibold text-white">
        Back to Home
      </Link>
    </main>
  );
}
