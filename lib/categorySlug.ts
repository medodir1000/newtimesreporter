import { categories } from "@/lib/mockData";

/** URL slug for a category label — must match links on the home page and article pages. */
export function categorySlugFromLabel(label: string): string {
  const match = categories.find((item) => item.label.toLowerCase() === label.toLowerCase());
  if (match) return match.slug;
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "news";
}

/** Heading text when the slug is not one of the curated `categories` entries. */
export function displayLabelFromSlug(slug: string): string {
  const known = categories.find((c) => c.slug === slug);
  if (known) return known.label;
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
