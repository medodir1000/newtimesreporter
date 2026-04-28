import logging
import os
import re
import sys
import json
import uuid
from io import BytesIO
from urllib.parse import urlparse
from urllib.request import Request, urlopen

try:
    from dotenv import load_dotenv

    _repo_root = os.path.dirname(os.path.abspath(__file__))
    load_dotenv(os.path.join(_repo_root, ".env.local"))
    load_dotenv(os.path.join(_repo_root, ".env"))
except ImportError:
    pass

import feedparser
from openai import OpenAI
from supabase import create_client

from google_indexer import notify_new_article

# RSS bot is OFF unless BOT_ENABLED=1 (manual articles only via Next.js /admin by default).
RSS_URL = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"

# RSS hero images: download → Pillow WebP (max width, quality) → Supabase Storage public object URL
# (standard /object/public/… — no Supabase Image Transform /render on Free plan; files are pre-optimized here).
IMAGE_MAX_WIDTH_PX = 800
IMAGE_WEBP_QUALITY = 75
IMAGE_MAX_DOWNLOAD_BYTES = 15 * 1024 * 1024
IMAGE_MAX_DECODE_PIXELS = 40_000_000
STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "article-images")


def max_articles_per_run() -> int:
    """How many RSS entries to process per run. Set BOT_MAX_ARTICLES=1 in .env.local to test a single article."""
    raw = os.getenv("BOT_MAX_ARTICLES", "8").strip()
    try:
        n = int(raw)
    except ValueError:
        return 8
    return max(1, min(n, 100))

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
# GitHub Secrets: SUPABASE_KEY, or service role / anon. Local: reuse Next.js NEXT_PUBLIC_SUPABASE_ANON_KEY if RLS allows inserts.
SUPABASE_KEY = (
    os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)
OPENROUTER_API_KEY = (
    os.getenv("OPENROUTER_API_KEY")
    or os.getenv("OPENROUTER_KEY")
    or os.getenv("OPENAI_API_KEY")
)
# Default: Gemini 2.0 Flash on OpenRouter (gemini-flash-1.5 slug is retired → 404). Override OPENROUTER_MODEL in .env.local.
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "https://newtimesreporter.com")
OPENROUTER_SITE_NAME = os.getenv("OPENROUTER_SITE_NAME", "New Times Reporter")


def site_public_base_url() -> str:
    """Same origin as Next.js NEXT_PUBLIC_SITE_URL / OpenRouter site URL (no trailing slash)."""
    raw = os.getenv("NEXT_PUBLIC_SITE_URL") or os.getenv("OPENROUTER_SITE_URL") or "https://newtimesreporter.com"
    return raw.strip().rstrip("/")


def _env_status(name: str) -> str:
    return "SET" if os.getenv(name) else "MISSING"


if __name__ == "__main__":
    _bot_on = os.getenv("BOT_ENABLED", "").strip().lower()
    if _bot_on not in ("1", "true", "yes"):
        print(
            "RSS bot disabled: set BOT_ENABLED=1 in .env.local to auto-publish from Google News RSS. "
            "Otherwise use /admin for manual articles only. Exiting."
        )
        sys.exit(0)

    _sb_ok = bool(SUPABASE_URL and SUPABASE_KEY)
    _llm_ok = bool(OPENROUTER_API_KEY)
    print(
        "Env check: "
        f"Supabase (URL + key)={'OK' if _sb_ok else 'MISSING'} — "
        f"OpenRouter API key={'OK' if _llm_ok else 'MISSING'} "
        f"(OPENROUTER_API_KEY / OPENROUTER_KEY / OPENAI_API_KEY)"
    )
    if not _sb_ok:
        print(
            "  detail: "
            f"SUPABASE_URL={_env_status('SUPABASE_URL')}, "
            f"NEXT_PUBLIC_SUPABASE_URL={_env_status('NEXT_PUBLIC_SUPABASE_URL')}, "
            f"SUPABASE_KEY={_env_status('SUPABASE_KEY')}, "
            f"SERVICE_ROLE={_env_status('SUPABASE_SERVICE_ROLE_KEY')}, "
            f"ANON={_env_status('SUPABASE_ANON_KEY')}, "
            f"NEXT_PUBLIC_ANON={_env_status('NEXT_PUBLIC_SUPABASE_ANON_KEY')}"
        )
    if not _llm_ok:
        print(
            "  detail: "
            f"OPENROUTER_API_KEY={_env_status('OPENROUTER_API_KEY')}, "
            f"OPENROUTER_KEY={_env_status('OPENROUTER_KEY')}, "
            f"OPENAI_API_KEY={_env_status('OPENAI_API_KEY')}"
        )

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Missing Supabase credentials. "
        "Local: add SUPABASE_URL + SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY) to .env.local "
        "in the repo root — or set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY like your Next.js app. "
        "GitHub Actions: repository Settings → Secrets and variables → Actions → SUPABASE_URL and SUPABASE_KEY."
    )
if not OPENROUTER_API_KEY:
    raise ValueError(
        "Missing OpenRouter API key. Add OPENROUTER_API_KEY (or OPENROUTER_KEY / OPENAI_API_KEY) to .env.local — "
        "create a key at https://openrouter.ai/keys (the bot calls https://openrouter.ai/api/v1). "
        "GitHub Actions: add OPENROUTER_API_KEY as an encrypted secret."
    )

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)


def _is_already_supabase_public_image(url: str) -> bool:
    if not url or not SUPABASE_URL:
        return False
    try:
        base = urlparse(SUPABASE_URL.rstrip("/"))
        u = urlparse(url)
        return (u.netloc == base.netloc or u.netloc.endswith(".supabase.co")) and "/storage/v1/object/public/" in u.path
    except Exception:
        return False


def _fetch_image_bytes(url: str) -> bytes | None:
    try:
        req = Request(url, headers={"User-Agent": "NewTimesReporterBot/1.0"})
        with urlopen(req, timeout=35) as resp:
            chunks: list[bytes] = []
            total = 0
            while True:
                chunk = resp.read(65536)
                if not chunk:
                    break
                if total + len(chunk) > IMAGE_MAX_DOWNLOAD_BYTES:
                    return None
                chunks.append(chunk)
                total += len(chunk)
            return b"".join(chunks)
    except Exception as exc:
        logging.getLogger(__name__).debug("Image fetch failed %s: %s", url, exc)
        return None


def _optimize_image_to_webp(raw: bytes) -> bytes:
    from PIL import Image, ImageOps

    Image.MAX_IMAGE_PIXELS = IMAGE_MAX_DECODE_PIXELS
    with Image.open(BytesIO(raw)) as im:
        im.seek(0)
        im = ImageOps.exif_transpose(im)
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
        elif im.mode != "RGB":
            im = im.convert("RGB")
        w, h = im.size
        if w > IMAGE_MAX_WIDTH_PX:
            new_h = max(1, round(h * (IMAGE_MAX_WIDTH_PX / w)))
            im = im.resize((IMAGE_MAX_WIDTH_PX, new_h), Image.Resampling.LANCZOS)
        out = BytesIO()
        im.save(out, format="WEBP", quality=IMAGE_WEBP_QUALITY, method=4)
        return out.getvalue()


def _upload_webp_to_storage(object_path: str, webp_bytes: bytes) -> str | None:
    try:
        supabase.storage.from_(STORAGE_BUCKET).upload(
            object_path,
            webp_bytes,
            file_options={
                "content-type": "image/webp",
                "cache-control": "31536000",
                "upsert": "true",
            },
        )
    except Exception as exc:
        logging.getLogger(__name__).warning("Supabase storage upload failed (%s): %s", object_path, exc)
        return None
    base = SUPABASE_URL.rstrip("/")
    return f"{base}/storage/v1/object/public/{STORAGE_BUCKET}/{object_path}"


def optimize_remote_image_and_upload(source_url: str, slug: str) -> str | None:
    """
    Download remote image, resize to max width IMAGE_MAX_WIDTH_PX, WebP quality IMAGE_WEBP_QUALITY,
    upload bytes to Supabase Storage. Returns public URL or None (caller may keep original URL).
    """
    if not source_url.strip():
        return None
    if _is_already_supabase_public_image(source_url):
        return source_url
    if os.getenv("BOT_SKIP_IMAGE_OPTIMIZE", "").strip().lower() in ("1", "true", "yes"):
        return None

    raw = _fetch_image_bytes(source_url.strip())
    if not raw:
        return None
    try:
        webp = _optimize_image_to_webp(raw)
    except Exception as exc:
        logging.getLogger(__name__).warning("Pillow optimize failed: %s", exc)
        return None

    safe = re.sub(r"[^a-z0-9-]+", "", slug.lower())[:80] or "article"
    object_path = f"bot-rss/{safe}-{uuid.uuid4().hex[:12]}.webp"
    return _upload_webp_to_storage(object_path, webp)


def slugify(text: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return base or "news-article"


def extract_image_url(entry) -> str | None:
    media_content = entry.get("media_content") or []
    if media_content and isinstance(media_content, list):
        first = media_content[0] or {}
        if first.get("url"):
            return first["url"]

    media_thumbnail = entry.get("media_thumbnail") or []
    if media_thumbnail and isinstance(media_thumbnail, list):
        first = media_thumbnail[0] or {}
        if first.get("url"):
            return first["url"]

    for link in entry.get("links", []):
        link_type = (link.get("type") or "").lower()
        href = link.get("href")
        if href and link_type.startswith("image/"):
            return href

    return None


VALID_CATEGORIES = [
    "World",
    "Politics",
    "Business",
    "Tech",
    "Sports",
    "Lifestyle",
    "Health",
    "Science",
    "Culture"
]


NOISY_BODY_PATTERNS = [
    r"^\s*here(?:'s| is)\b",
    r"^\s*this article\b",
    r"^\s*output strict json\b",
    r"^\s*json schema\b",
    r"^\s*requirements?:\b",
    r"^\s*input headline:\b",
    r"^\s*input summary:\b",
    r"^\s*source url:\b",
    r"^\s*published at:\b",
    r"^\s*إليك\b",
]


def strip_source_attribution_suffix(text: str) -> str:
    """
    Remove anything from a trailing 'Source:' (start of line) through end of string.
    Keeps the article body only; LLMs often append 'Source: https://...' after the article.
    """
    t = (text or "").replace("\r\n", "\n").strip()
    if not t:
        return t
    if re.match(r"(?is)^\s*Source\s*:", t):
        return ""
    t = re.sub(r"(?is)\n\s*Source\s*:.*\Z", "", t).rstrip()
    t = re.sub(r"(?is)\s{2,}Source\s*:.*\Z", "", t).rstrip()
    # Any remaining line that is only "Source: …" (whole line)
    lines_out: list[str] = []
    for line in t.split("\n"):
        if re.match(r"(?is)^\s*Source\s*:", line.strip()):
            continue
        lines_out.append(line)
    t = "\n".join(lines_out).strip()
    return t


def strip_google_news_urls_and_artifacts(text: str) -> str:
    """Remove Google News redirect URLs and stray fragments the LLM may paste into the body."""
    t = (text or "").replace("\r\n", "\n")
    t = re.sub(r"https?://(?:[a-z0-9-]+\.)?news\.google\.com[^\s)\]>'\"<>]*", "", t, flags=re.IGNORECASE)
    t = re.sub(r"(?i)\bnews\.google\.com[^\s)\]>'\"<>]*", "", t)
    t = re.sub(r"\(\s*\)", "", t)
    t = re.sub(r"\[\s*\]", "", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def clean_generated_body(body: str, headline: str) -> str:
    text = (body or "").replace("\r\n", "\n").strip()
    text = strip_source_attribution_suffix(text)
    text = strip_google_news_urls_and_artifacts(text)
    if not text:
        return text

    lines = [line.strip() for line in text.split("\n")]
    cleaned_lines: list[str] = []

    for line in lines:
        if not line:
            cleaned_lines.append("")
            continue
        lower = line.lower()
        if any(re.match(pattern, lower, flags=re.IGNORECASE) for pattern in NOISY_BODY_PATTERNS):
            continue
        cleaned_lines.append(line)

    # Remove duplicated headline if model put it as first line.
    while cleaned_lines and cleaned_lines[0].strip(" #:-").lower() == headline.strip().lower():
        cleaned_lines.pop(0)

    cleaned = "\n".join(cleaned_lines).strip()
    return cleaned or text


def rewrite_article(title: str, summary: str, source_link: str, published_at: str | None) -> dict:
    prompt = f"""
You are a senior international newsroom editor.
Rewrite the input into a PREMIUM, in-depth article for New Times Reporter.

Requirements:
- Output STRICT JSON only (no markdown, no commentary).
- Professional publication tone.
- Article length: 900-1400 words.
- Structure with short subheadings (plain text lines) and strong paragraph flow.
- Include context, stakes, timeline, and implications.
- Keep facts grounded in input; do not invent exact quotes or unverifiable numbers.
- Do not end the body with a "Source:" line or raw source URLs; the article body must stand alone.
- Do not paste Google News URLs (news.google.com) into the body.
- Write in clear journalistic English.
- Choose category from this exact list: {", ".join(VALID_CATEGORIES)}.
- Produce 5-10 hashtags (without # symbol in values).
- Produce SEO fields.

JSON schema:
{{
  "headline": "string",
  "body": "string",
  "category": "one of categories",
  "hashtags": ["string"],
  "seo_title": "string",
  "seo_description": "string",
  "seo_keywords": ["string"],
  "author": "string"
}}

Input headline: {title}
Input summary: {summary}
Source URL: {source_link}
Published at: {published_at or ""}
""".strip()

    response = client.chat.completions.create(
        model=OPENROUTER_MODEL,
        extra_headers={
            "HTTP-Referer": OPENROUTER_SITE_URL,
            "X-Title": OPENROUTER_SITE_NAME
        },
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )
    text = response.choices[0].message.content or ""
    text = text.strip()

    try:
        data = json.loads(text)
        headline = str(data.get("headline") or title).strip() or title
        body = str(data.get("body") or summary or title).strip() or (summary or title)
        body = clean_generated_body(body, headline)
        category = str(data.get("category") or "World").strip().title()
        if category not in VALID_CATEGORIES:
            category = "World"

        hashtags = data.get("hashtags") or []
        if not isinstance(hashtags, list):
            hashtags = []
        hashtags = [str(tag).strip().replace("#", "") for tag in hashtags if str(tag).strip()]

        seo_title = str(data.get("seo_title") or headline).strip() or headline
        seo_description = str(data.get("seo_description") or (body[:160] if body else headline)).strip()

        seo_keywords = data.get("seo_keywords") or []
        if not isinstance(seo_keywords, list):
            seo_keywords = []
        seo_keywords = [str(keyword).strip() for keyword in seo_keywords if str(keyword).strip()]

        author = str(data.get("author") or "News Desk").strip() or "News Desk"

        return {
            "headline": headline,
            "body": body,
            "category": category,
            "hashtags": hashtags,
            "seo_title": seo_title,
            "seo_description": seo_description,
            "seo_keywords": seo_keywords,
            "author": author
        }
    except Exception:
        return {
            "headline": title,
            "body": clean_generated_body(text or summary or title, title),
            "category": "World",
            "hashtags": [],
            "seo_title": title,
            "seo_description": (summary or title)[:160],
            "seo_keywords": [],
            "author": "News Desk"
        }


def start_bot():
    feed = feedparser.parse(RSS_URL)
    limit = max_articles_per_run()
    print(f"Fetched {len(feed.entries)} entries from RSS. Processing up to {limit} article(s) (BOT_MAX_ARTICLES).")

    for entry in feed.entries[:limit]:
        title = (entry.get("title") or "").strip()
        if not title:
            continue

        summary = (entry.get("summary") or "").strip()
        source_link = (entry.get("link") or "").strip()
        published_at = (entry.get("published") or "").strip() or None
        image_url = extract_image_url(entry)  # Keep None if no image. Do not skip.

        try:
            rewritten = rewrite_article(title, summary, source_link, published_at)
        except Exception as err:
            print(f"OpenRouter error for '{title}': {err}")
            rewritten = {
                "headline": title,
                "body": clean_generated_body(summary or title, title),
                "category": "World",
                "hashtags": [],
                "seo_title": title,
                "seo_description": (summary or title)[:160],
                "seo_keywords": [],
                "author": "News Desk"
            }

        rewritten_title = rewritten["headline"]
        rewritten_content = rewritten["body"]
        rewritten_category = rewritten["category"]
        rewritten_hashtags = rewritten["hashtags"]
        rewritten_seo_title = rewritten["seo_title"]
        rewritten_seo_description = rewritten["seo_description"]
        rewritten_seo_keywords = rewritten["seo_keywords"]
        rewritten_author = rewritten["author"]

        slug = slugify(rewritten_title)

        image_for_db = image_url or ""
        if image_url:
            optimized_url = optimize_remote_image_and_upload(image_url, slug)
            if optimized_url:
                image_for_db = optimized_url
                if optimized_url.strip().rstrip("/") != image_url.strip().rstrip("/"):
                    print(f"Image: WebP optimized & uploaded (max {IMAGE_MAX_WIDTH_PX}px, quality {IMAGE_WEBP_QUALITY})")
            else:
                print("Image: optimize/upload skipped (using original RSS URL)")

        data = {
            "title": rewritten_title,
            "content": rewritten_content,
            "image_url": image_for_db,
            "slug": slug,
            "category": rewritten_category,
            "author": rewritten_author,
            "hashtags": rewritten_hashtags,
            "seo_title": rewritten_seo_title,
            "seo_description": rewritten_seo_description,
            "seo_keywords": rewritten_seo_keywords
        }

        print(f"Attempting to insert: {rewritten_title}")
        try:
            supabase.table("articles").upsert(data, on_conflict="slug").execute()
            print(f"Published/updated: {rewritten_title}")
            base = site_public_base_url()
            article_url = f"{base}/article/{slug}"
            sitemap_url = f"{base}/sitemap.xml"
            try:
                notify_new_article(article_url, sitemap_url)
            except Exception as ping_err:
                print(f"Search notify (indexing/ping) skipped: {ping_err}")
        except Exception as err:
            print(f"Supabase insert error for '{rewritten_title}': {err}")

if __name__ == "__main__":
    start_bot()