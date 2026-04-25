import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { tickerItems } from "@/lib/mockData";

export default function AboutUsPage() {
  return (
    <main>
      <Navbar tickerItems={tickerItems} />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-bold text-news-black sm:text-5xl">About New Times Reporter</h1>
        <p className="mt-5 text-lg leading-8 text-zinc-700">
          New Times Reporter is an independent digital newsroom focused on clear reporting, sharp analysis, and stories that matter in everyday life.
          We cover world affairs, policy, business, technology, and culture with a simple goal: help readers understand what is happening and why it
          matters now.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 p-6">
            <h2 className="font-serif text-2xl font-bold text-news-black">Our Editorial Mission</h2>
            <p className="mt-3 leading-7 text-zinc-700">
              We prioritize verified facts over noise, context over clickbait, and accountability over speculation. Our editors work closely with
              reporters to keep coverage accurate, readable, and useful for a global audience.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-6">
            <h2 className="font-serif text-2xl font-bold text-news-black">Our Values</h2>
            <p className="mt-3 leading-7 text-zinc-700">
              Accuracy, independence, transparency, and fairness guide our daily work. When we make a mistake, we correct it clearly and quickly.
              Trust is earned one story at a time.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-zinc-50 p-6">
          <h2 className="font-serif text-2xl font-bold text-news-black">Who We Serve</h2>
          <p className="mt-3 leading-7 text-zinc-700">
            Our readers include students, professionals, policy watchers, and anyone who wants calm, credible journalism. Whether you check in for
            breaking updates or deep weekend reads, we aim to make your time well spent.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
