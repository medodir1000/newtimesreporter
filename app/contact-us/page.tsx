import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { tickerItems } from "@/lib/mockData";

export default function ContactUsPage() {
  return (
    <main>
      <Navbar tickerItems={tickerItems} />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-bold text-news-black sm:text-5xl">Contact Us</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">
          We read every message. If you have a correction, a tip, a partnership request, or feedback about our coverage, reach out through the right
          channel below and our team will get back to you.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 p-6">
            <h2 className="font-serif text-2xl font-bold text-news-black">Editorial Desk</h2>
            <ul className="mt-4 space-y-2 text-zinc-700">
              <li>Email: editorial@newtimesreporter.com</li>
              <li>Phone: +1 (202) 555-0182</li>
              <li>Hours: Monday - Friday, 09:00 - 18:00</li>
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-200 p-6">
            <h2 className="font-serif text-2xl font-bold text-news-black">General Inquiries</h2>
            <ul className="mt-4 space-y-2 text-zinc-700">
              <li>Email: hello@newtimesreporter.com</li>
              <li>Advertising: ads@newtimesreporter.com</li>
              <li>Address: 85 Park Avenue, New York, NY</li>
            </ul>
          </div>
        </div>

        <form className="mt-8 rounded-xl border border-zinc-200 p-6">
          <h2 className="font-serif text-2xl font-bold text-news-black">Send a Message</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Full Name"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
            />
            <input
              type="email"
              placeholder="Email Address"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
            />
          </div>
          <input
            type="text"
            placeholder="Subject"
            className="mt-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
          />
          <textarea
            rows={5}
            placeholder="Write your message..."
            className="mt-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-news-red"
          />
          <button type="submit" className="mt-4 rounded-md bg-news-red px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white">
            Send Message
          </button>
        </form>
      </section>
      <Footer />
    </main>
  );
}
