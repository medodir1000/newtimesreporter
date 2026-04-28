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

try:
    from dotenv import load_dotenv

    _root = os.path.dirname(os.path.abspath(__file__))
    load_dotenv(os.path.join(_root, ".env.local"), interpolate=False)
    load_dotenv(os.path.join(_root, ".env"), interpolate=False)
except ImportError:
    pass

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
        raw = (os.getenv("GOOGLE_INDEXING_SA_JSON") or os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or "").strip()
        if not raw:
            print(
                "\nMissing credentials: set GOOGLE_INDEXING_SA_JSON or GOOGLE_APPLICATION_CREDENTIALS in .env.local\n"
                "  Example: GOOGLE_INDEXING_SA_JSON=C:\\\\path\\\\to\\\\service-account.json\n"
                "  The service account must be an Owner on the site in Google Search Console, and the\n"
                "  Google project must have the Indexing API enabled.\n"
            )
            return 2
        resolved = raw.strip('"')
        if not os.path.isfile(resolved):
            print("\nFile not found. Path as read from the environment (repr shows hidden characters):")
            print(f"  {resolved!r}\n")
            if any(ch in resolved for ch in "\n\r\x08"):
                print(
                    "Tip: The path is broken by escape sequences (e.g. \\n in \\newtimesreporter, \\b in \\bot).\n"
                    "  In .env.local use forward slashes:\n"
                    "    GOOGLE_INDEXING_SA_JSON=C:/Users/lenovo/Desktop/newtimesreporter/bot/service-account.json\n"
                    "  Or wrap in double quotes with doubled backslashes.\n"
                    "  In PowerShell use SINGLE quotes so backslashes are literal:\n"
                    "    $env:GOOGLE_INDEXING_SA_JSON = 'C:\\Users\\lenovo\\Desktop\\newtimesreporter\\bot\\service-account.json'\n"
                )
            else:
                print(
                    "Check that the file exists. Prefer an absolute path; in .env.local forward slashes are safest on Windows.\n"
                )
            return 2
        ok = publish_url(target)
        if ok:
            print("OK: Indexing API returned success for URL_UPDATED.")
        else:
            print("FAILED: Indexing API did not succeed (see INFO/WARNING lines above).")
        return 0 if ok else 1

    article_url = args.url if args.url else f"{base}/"
    print(f"notify_new_article(article={article_url!r}, sitemap={sitemap_url!r})")
    notify_new_article(article_url, sitemap_url)
    return 0


if __name__ == "__main__":
    sys.exit(main())
