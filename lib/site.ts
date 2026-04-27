/** Display name across the UI, metadata, and JSON-LD. */
export const SITE_NAME = "Free Memes";

/** Canonical / share base URL. Override in env when the real domain is live. */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://freememes.com").replace(/\/$/, "");
}

/** Default byline when the database has no author. */
export const DEFAULT_ARTICLE_AUTHOR = "Free Memes";

/** Default admin login hint (override with ADMIN_EMAIL). */
export const DEFAULT_ADMIN_EMAIL = "admin@freememes.com";
