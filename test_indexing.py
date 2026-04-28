"""
Smoke test for google_indexer (Indexing API + sitemap pings).

From repo root:
  python test_indexing.py
  python test_indexing.py --url https://example.com/article/my-slug
  python test_indexing.py --ping-only
  python test_indexing.py --index-only --url https://example.com/article/my-slug

Requires for Indexing API: GOOGLE_INDEXING_SA_JSON or GOOGLE_APPLICATION_CREDENTIALS
pointing to a service account JSON with access to Search Console for the site.
"""

from __future__ import annotations

import argparse
import logging
import os
import sys

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

from google_indexer import notify_new_article, ping_sitemaps, publish_url


def site_base() -> str:
    return (
        os.getenv("NEXT_PUBLIC_SITE_URL") or os.getenv("OPENROUTER_SITE_URL") or "https://newtimesreporter.com"
    ).rstrip("/")


def main() -> int:
    parser = argparse.ArgumentParser(description="Test Google Indexing API + sitemap pings")
    parser.add_argument(
        "--url",
        help="Article URL for Indexing API (default: site homepage)",
    )
    parser.add_argument("--ping-only", action="store_true", help="Only GET sitemap pings (Google + Bing)")
    parser.add_argument("--index-only", action="store_true", help="Only Indexing API URL_UPDATED (no pings)")
    args = parser.parse_args()

    base = site_base()
    sitemap_url = f"{base}/sitemap.xml"

    if args.ping_only:
        print(f"Pinging sitemaps: {sitemap_url}")
        ping_sitemaps(sitemap_url)
        return 0

    if args.index_only:
        target = args.url or f"{base}/"
        print(f"Indexing API URL_UPDATED: {target}")
        ok = publish_url(target)
        return 0 if ok else 1

    article_url = args.url if args.url else f"{base}/"
    print(f"notify_new_article(article={article_url!r}, sitemap={sitemap_url!r})")
    notify_new_article(article_url, sitemap_url)
    return 0


if __name__ == "__main__":
    sys.exit(main())
