/**
 * Image URLs for next/image: Unsplash query params for sizing; Supabase stays on
 * standard `/storage/v1/object/public/` URLs (free tier — no `/render/image`).
 * Pair with `sizes` + aspect-ratio wrappers for CLS/LCP.
 */

const SUPABASE_OBJECT_MARKER = "/storage/v1/object/public/";

/**
 * Unsplash CDN: cap width + quality.
 */
export function resizeUnsplash(url: string, width: number, quality = 65) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "images.unsplash.com") {
      return url;
    }
    parsed.search = "";
    parsed.searchParams.set("auto", "format");
    parsed.searchParams.set("fit", "crop");
    parsed.searchParams.set("w", String(width));
    parsed.searchParams.set("q", String(quality));
    return parsed.href;
  } catch {
    return url;
  }
}

/**
 * Supabase Storage public object URL only (no Image Transformation API on free plan).
 * Returns the canonical URL string when the path is a public object URL; otherwise null.
 */
export function supabaseRenderPublicUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (!u.pathname.includes(SUPABASE_OBJECT_MARKER)) {
      return null;
    }
    return u.toString();
  } catch {
    return null;
  }
}

/** Target decode width in CSS pixels (Next `sizes` should match). ~2× for retina capped server-side. */
export function articleImageUrl(url: string, displayWidthPx: number, quality = 78): string {
  if (!url?.trim()) return url;
  const trimmed = url.trim();
  const decodeW = Math.min(2048, Math.max(64, Math.round(displayWidthPx * 2)));

  try {
    const host = new URL(trimmed).hostname;
    if (host === "images.unsplash.com") {
      const q = Math.min(90, Math.max(45, quality));
      return resizeUnsplash(trimmed, decodeW, q);
    }
    const supabasePublic = supabaseRenderPublicUrl(trimmed);
    return supabasePublic ?? trimmed;
  } catch {
    return trimmed;
  }
}

/** Presets aligned with common layout slots (decode width basis). */
export const imgPreset = {
  thumb: 112,
  row: 160,
  listFeatured: 200,
  card: 360,
  hero: 720,
  articleLead: 900
} as const;

export const unsplashThumb = (url: string) => articleImageUrl(url, imgPreset.thumb);
export const unsplashRow = (url: string) => articleImageUrl(url, imgPreset.row);
export const unsplashListFeatured = (url: string) => articleImageUrl(url, imgPreset.listFeatured);
export const unsplashCard = (url: string) => articleImageUrl(url, imgPreset.card);
export const unsplashHero = (url: string) => articleImageUrl(url, imgPreset.hero);
export const unsplashArticle = (url: string) => articleImageUrl(url, imgPreset.articleLead);

export function blurPlaceholderDataURL() {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='32' height='20' viewBox='0 0 32 20'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#e4e4e7' />
          <stop offset='50%' stop-color='#f4f4f5' />
          <stop offset='100%' stop-color='#e4e4e7' />
        </linearGradient>
      </defs>
      <rect width='32' height='20' fill='url(#g)' />
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
