import Link from "next/link";
import { categories } from "@/lib/mockData";
import { SITE_NAME } from "@/lib/site";
import { Logo } from "./Logo";

const quickLinks = [
  { label: "About Us", href: "/about-us" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Contact Us", href: "/contact-us" }
];
export function Footer() {
  return (
    <footer className="mt-16 bg-news-black text-zinc-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-3 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="mb-4">
            <Logo compact light />
          </div>
          <h3 className="mb-3 font-serif text-xl font-bold text-white">About</h3>
          <p className="text-sm leading-6 text-zinc-300">
            {SITE_NAME} delivers sharp journalism, in-depth analysis, and breaking updates that matter to global readers.
          </p>
        </div>

        <div>
          <h3 className="mb-3 font-serif text-xl font-bold text-white">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            {quickLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="hover:text-news-red">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-serif text-xl font-bold text-white">Categories</h3>
          <ul className="space-y-2 text-sm">
            {categories.map((item) => (
              <li key={item.slug}>
                <Link href={`/category/${item.slug}`} className="hover:text-news-red">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-serif text-xl font-bold text-white">Contact Info</h3>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li>Editorial Desk: +1 (202) 555-0182</li>
            <li>Email: hello@newtimesreporter.com</li>
            <li>Address: 85 Park Avenue, New York, NY</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-300">
        Copyright 2026 {SITE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
