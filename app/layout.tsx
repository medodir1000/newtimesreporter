import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import { AdSenseScript } from "@/components/AdSenseScript";
import { GoogleAnalyticsTag } from "@/components/GoogleAnalyticsTag";
import { GoogleTagManager } from "@/components/GoogleTagManager";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

function supabaseOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: true,
  preload: true
});

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-merriweather",
  weight: ["400", "700"],
  display: "swap",
  adjustFontFallback: true,
  preload: false
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "A high-end modern news portal built with Next.js.",
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
  const sbOrigin = supabaseOrigin();
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <head>
        {sbOrigin && (
          <>
            <link rel="dns-prefetch" href={sbOrigin} />
            <link rel="preconnect" href={sbOrigin} />
          </>
        )}
      </head>
      <body>
        <GoogleAnalyticsTag />
        <GoogleTagManager />
        <AdSenseScript />
        {children}
      </body>
    </html>
  );
}
