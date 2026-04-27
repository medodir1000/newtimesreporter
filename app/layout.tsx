import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import { AdSenseScript } from "@/components/AdSenseScript";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: true
});

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-merriweather",
  weight: ["400", "700"],
  display: "swap",
  adjustFontFallback: true
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "Free Memes — stories, culture, and shareable moments. Built with Next.js.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <body>
        <AdSenseScript />
        {children}
      </body>
    </html>
  );
}
