"""
Google Indexing API + sitemap ping (Google + Bing).
Requires a Search Console–verified property and the service account added as Owner on that property.

Env:
  GOOGLE_INDEXING_SA_JSON or GOOGLE_APPLICATION_CREDENTIALS → path to service account JSON
"""

from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request

from google.oauth2 import service_account
from google_auth_httplib2 import AuthorizedHttp

logger = logging.getLogger(__name__)

INDEXING_SCOPE = ["https://www.googleapis.com/auth/indexing"]
INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"


def _service_account_json_path() -> str | None:
    path = os.getenv("GOOGLE_INDEXING_SA_JSON") or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not path:
        return None
    path = path.strip().strip('"')
    if not os.path.isfile(path):
        extra = ""
        if any(c in path for c in "\n\r\x08"):
            extra = (
                " Path looks mangled by escape sequences (\\n, \\b, …) — use forward slashes in .env.local "
                "or PowerShell single-quoted paths."
            )
        logger.warning("Indexing API: JSON file missing or invalid path: %r.%s", path, extra)
        return None
    return path


def publish_url(url: str) -> bool:
    """
    Send URL_UPDATED to Google Indexing API.
    Returns True on HTTP 200/204, False if skipped or on error.
    """
    path = _service_account_json_path()
    if not path:
        logger.info(
            "Indexing API: skip — set GOOGLE_INDEXING_SA_JSON or GOOGLE_APPLICATION_CREDENTIALS "
            "to an absolute path of the service account JSON (add in .env.local at repo root)."
        )
        return False

    creds = service_account.Credentials.from_service_account_file(path, scopes=INDEXING_SCOPE)
    http = AuthorizedHttp(creds)
    body = json.dumps({"url": url, "type": "URL_UPDATED"}).encode("utf-8")
    response, content = http.request(
        INDEXING_ENDPOINT,
        method="POST",
        body=body,
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    text = content.decode("utf-8", errors="replace") if content else ""
    if response.status not in (200, 204):
        logger.warning("Indexing API: status=%s body=%s", getattr(response, "status", response), text[:800])
        return False
    logger.info("Indexing API: URL_UPDATED %s", url)
    return True


def ping_sitemaps(sitemap_url: str) -> None:
    """
    Legacy GET sitemap “ping” URLs (Google + Bing). Both endpoints are deprecated (404 / 410);
    discovery now relies on Search Console, sitemaps in robots.txt, and the Indexing API above.
    Kept as best-effort no-ops for older setups; 404/410 are logged at DEBUG only.
    """
    for base in ("https://www.google.com/ping", "https://www.bing.com/ping"):
        query = urllib.parse.urlencode({"sitemap": sitemap_url})
        full = f"{base}?{query}"
        try:
            req = urllib.request.Request(full, method="GET", headers={"User-Agent": "NewTimesReporterBot/1.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                logger.info("Sitemap ping %s → HTTP %s", base, resp.getcode())
        except urllib.error.HTTPError as exc:
            if exc.code in (404, 410):
                logger.debug("Sitemap ping skipped (deprecated): %s → HTTP %s", base, exc.code)
            else:
                logger.warning("Sitemap ping HTTPError %s: %s", base, exc)
        except Exception as exc:
            logger.warning("Sitemap ping failed %s: %s", base, exc)


def notify_new_article(article_url: str, sitemap_url: str) -> None:
    """After a successful publish: Indexing API + ping both engines."""
    publish_url(article_url)
    ping_sitemaps(sitemap_url)


def _site_base() -> str:
    return (
        os.getenv("NEXT_PUBLIC_SITE_URL") or os.getenv("OPENROUTER_SITE_URL") or "https://newtimesreporter.com"
    ).rstrip("/")


if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    base = _site_base()
    sitemap_url = f"{base}/sitemap.xml"
    article_url = sys.argv[1].strip() if len(sys.argv) > 1 else f"{base}/"
    print(f"notify_new_article({article_url!r}, {sitemap_url!r})", flush=True)
    notify_new_article(article_url, sitemap_url)
