/**
 * Unsplash CDN: cap width + quality so bytes stay small.
 * Use with next/image `sizes` so layout still picks a sensible slot.
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

/** Sidebar thumb ~80px wide → tiny file */
export const unsplashThumb = (url: string) => resizeUnsplash(url, 200, 52);

/** List rows with slightly larger thumb */
export const unsplashRow = (url: string) => resizeUnsplash(url, 300, 55);

/** Small article cards in grids */
export const unsplashCard = (url: string) => resizeUnsplash(url, 520, 58);

/** Home hero / big story (still under 1MB budget) */
export const unsplashHero = (url: string) => resizeUnsplash(url, 960, 62);

/** Article lead image */
export const unsplashArticle = (url: string) => resizeUnsplash(url, 1080, 62);

/**
 * Lightweight blurred placeholder for progressive image loading.
 */
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
