import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { tickerItems } from "@/lib/mockData";

export default function PrivacyPolicyPage() {
  return (
    <main>
      <Navbar tickerItems={tickerItems} />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-bold text-news-black sm:text-5xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-zinc-500">Last updated: April 25, 2026</p>

        <div className="mt-8 space-y-7 text-zinc-700">
          <section>
            <h2 className="font-serif text-2xl font-bold text-news-black">Information We Collect</h2>
            <p className="mt-2 leading-7">
              We collect information you provide directly, such as your email when you subscribe to newsletters or contact our editorial team. We also
              collect limited technical data like browser type, device information, and page interactions to improve performance and content relevance.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-news-black">How We Use Information</h2>
            <p className="mt-2 leading-7">
              We use data to deliver newsletters, respond to messages, measure audience engagement, and improve site quality. We do not sell personal
              information to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-news-black">Cookies and Analytics</h2>
            <p className="mt-2 leading-7">
              Cookies help us remember preferences and understand how readers navigate our pages. You can disable cookies in your browser settings, but
              some features may work less smoothly as a result.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-news-black">Data Retention and Security</h2>
            <p className="mt-2 leading-7">
              We retain data only for as long as needed to provide services, comply with legal requirements, and protect our platform. We apply
              reasonable technical and organizational measures to safeguard stored information.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-news-black">Your Rights</h2>
            <p className="mt-2 leading-7">
              You may request access, correction, or deletion of your personal information by contacting us. For privacy requests, email
              privacy@newtimesreporter.com and include enough details for verification.
            </p>
          </section>
        </div>
      </section>
      <Footer />
    </main>
  );
}
