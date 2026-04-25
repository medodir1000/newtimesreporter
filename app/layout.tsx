import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import { AdSenseScript } from "@/components/AdSenseScript";
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
  title: "New Times Reporter",
  description: "A high-end modern news portal built with Next.js."
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
