import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { tickerItems } from "@/lib/mockData";

export default function TermsOfServicePage() {
  return (
    <main>
      <Navbar tickerItems={tickerItems} />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-bold text-news-black sm:text-5xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-zinc-500">Effective date: April 25, 2026</p>

        <div className="mt-8 space-y-7 text-zinc-700">
          <section>
            <h2 className="font-serif text-2xl font-bold text-news-black">1. Use of the Website</h2>
            <p className="mt-2 leading-7">
              By using New Times Reporter, you agree to access the website for lawful and personal use. You may read, share, and reference our public
              content, but you may not copy large portions, republish entire articles, or misuse our material in a way that violates copyright or harms
              our newsroom.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-news-black">2. Accounts and Subscriptions</h2>
            <p className="mt-2 leading-7">
              Some features may require newsletter signup or account creation. You are responsible for providing accurate details and keeping your login
              credentials secure. We may suspend accounts involved in abuse, fraud, or repeated policy violations.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-news-black">3. User Conduct</h2>
            <p className="mt-2 leading-7">
              You agree not to post or transmit harmful code, abusive content, misinformation campaigns, or attempts to disrupt service performance.
              Automated scraping that places excessive load on our systems is prohibited unless explicitly authorized.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-news-black">4. Intellectual Property</h2>
            <p className="mt-2 leading-7">
              All logos, article text, graphics, and brand assets on this website belong to New Times Reporter or licensed partners. Limited quotation
              with clear attribution is allowed; commercial reuse requires written permission.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-news-black">5. Changes and Availability</h2>
            <p className="mt-2 leading-7">
              We may update these terms and website features over time. Continued use after updates means you accept the revised terms. We do our best to
              maintain uptime but cannot guarantee uninterrupted access during maintenance or technical incidents.
            </p>
          </section>
        </div>
      </section>
      <Footer />
    </main>
  );
}
