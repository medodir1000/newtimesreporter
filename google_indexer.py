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
from concurrent.futures import ThreadPoolExecutor, as_completed

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2 import service_account

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


def _indexing_service():
    path = _service_account_json_path()
    if not path:
        logger.info(
            "Indexing API: skip — set GOOGLE_INDEXING_SA_JSON or GOOGLE_APPLICATION_CREDENTIALS "
            "to an absolute path of the service account JSON (add in .env.local at repo root)."
        )
        return None
    creds = service_account.Credentials.from_service_account_file(path, scopes=INDEXING_SCOPE)
    return build("indexing", "v3", credentials=creds, cache_discovery=False)


def notify_google_indexing(url: str, action: str = "URL_UPDATED") -> bool:
    """
    Notify Google Indexing API for one URL.
    action must be URL_UPDATED or URL_DELETED.
    Returns True on HTTP 200/204, False if skipped or on error.
    """
    normalized_url = (url or "").strip()
    if not normalized_url:
        logger.warning("Indexing API: skipped empty URL")
        return False

    action = (action or "URL_UPDATED").strip().upper()
    if action not in {"URL_UPDATED", "URL_DELETED"}:
        logger.warning("Indexing API: invalid action=%r (expected URL_UPDATED/URL_DELETED)", action)
        return False

    service = _indexing_service()
    if service is None:
        return False

    try:
        response = (
            service.urlNotifications()
            .publish(body={"url": normalized_url, "type": action})
            .execute()
        )
        logger.info("Indexing API: %s %s", action, normalized_url)
        logger.debug("Indexing API response: %s", json.dumps(response)[:1000])
        return True
    except HttpError as exc:
        status = getattr(exc.resp, "status", None)
        body = ""
        try:
            body = exc.content.decode("utf-8", errors="replace") if exc.content else ""
        except Exception:
            body = str(exc)
        if status in (429, 403):
            logger.warning(
                "Indexing API quota/permission error (status=%s) for %s: %s",
                status,
                normalized_url,
                body[:800],
            )
        else:
            logger.warning(
                "Indexing API HTTP error (status=%s) for %s: %s",
                status,
                normalized_url,
                body[:800],
            )
        return False
    except FileNotFoundError:
        logger.warning("Indexing API key file missing. Check GOOGLE_INDEXING_SA_JSON path.")
        return False
    except Exception as exc:
        logger.warning("Indexing API unexpected error for %s: %s", normalized_url, exc)
        return False


def notify_google_indexing_batch(
    urls: list[str],
    action: str = "URL_UPDATED",
    max_workers: int = 4,
) -> dict[str, bool]:
    """
    Notify Indexing API for multiple URLs concurrently.
    Returns mapping: url -> success.
    """
    cleaned = []
    for u in urls:
        uu = (u or "").strip()
        if uu and uu not in cleaned:
            cleaned.append(uu)
    if not cleaned:
        return {}

    workers = max(1, min(int(max_workers or 1), 10))
    results: dict[str, bool] = {}
    with ThreadPoolExecutor(max_workers=workers) as pool:
        future_map = {pool.submit(notify_google_indexing, u, action): u for u in cleaned}
        for fut in as_completed(future_map):
            u = future_map[fut]
            try:
                results[u] = bool(fut.result())
            except Exception as exc:
                logger.warning("Indexing API batch failed for %s: %s", u, exc)
                results[u] = False
    return results


def publish_url(url: str) -> bool:
    """Backward-compatible alias for older callers."""
    return notify_google_indexing(url, "URL_UPDATED")


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
    notify_google_indexing(article_url, "URL_UPDATED")
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
