/** Display name across the UI, metadata, and JSON-LD. */
export const SITE_NAME = "New Times Reporter";

/** Canonical / share base URL. Override with NEXT_PUBLIC_SITE_URL on Netlify / other hosts. */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://newtimesreporter.com").replace(/\/$/, "");
}

/** Default byline when the database has no author. */
export const DEFAULT_ARTICLE_AUTHOR = "New Time Reporter";

/** Default admin login hint (override with ADMIN_EMAIL). */
export const DEFAULT_ADMIN_EMAIL = "admin@newtimesreporter.com";
