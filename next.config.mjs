/** @type {import('next').NextConfig} */

function supabaseStorageImagePatterns() {
  /** @type {import('next').RemotePattern[]} */
  const patterns = [];
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (raw) {
    try {
      const host = new URL(raw).hostname;
      patterns.push({
        protocol: "https",
        hostname: host,
        pathname: "/storage/**"
      });
    } catch {
      /* ignore */
    }
  }
  patterns.push({
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/**"
  });
  return patterns;
}

/**
 * Security headers (Best Practices / hardening).
 * CSP: do not add a blanket policy here without nonces — it can break GTM, AdSense, and inline bootstraps.
 */
function securityHeaders() {
  /** @type {{ key: string; value: string }[]} */
  const list = [
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()"
    }
  ];
  if (process.env.NODE_ENV === "production") {
    list.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains; preload"
    });
  }
  return list;
}

// Images: keep remotePatterns for Unsplash + Supabase; leave `images.unoptimized` unset (false)
// so Netlify’s Next runtime can route through Netlify Image CDN / built-in optimization.

const cacheImmutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
const cacheShort = [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }];

const nextConfig = {
  async headers() {
    return [
      { source: "/icon.svg", headers: cacheImmutable },
      { source: "/favicon.ico", headers: cacheImmutable },
      { source: "/robots.txt", headers: cacheShort },
      { source: "/sitemap.xml", headers: cacheShort },
      {
        source: "/:path*",
        headers: securityHeaders()
      }
    ];
  },
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      ...supabaseStorageImagePatterns()
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    deviceSizes: [360, 414, 640, 750, 828, 960, 1080, 1200],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 160, 192, 256]
  },
  experimental: {
    optimizePackageImports: ["lucide-react"]
  }
};

export default nextConfig;
