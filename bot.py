import os
import re
import json
from urllib.parse import urlparse

import feedparser
from openai import OpenAI
from supabase import create_client

RSS_URL = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"

SUPABASE_URL = os.getenv("SUPABASE_URL")
# GitHub Secrets: use SUPABASE_KEY, or map service role / anon to these env names in the workflow.
SUPABASE_KEY = (
    os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "https://newtimesreporter.com")
OPENROUTER_SITE_NAME = os.getenv("OPENROUTER_SITE_NAME", "New Times Reporter")


def _env_status(name: str) -> str:
    return "SET" if os.getenv(name) else "MISSING"


if __name__ == "__main__":
    # Helpful in GitHub Actions logs (never print secret values).
    print(
        "Env check: "
        f"SUPABASE_URL={_env_status('SUPABASE_URL')}, "
        f"SUPABASE_KEY={_env_status('SUPABASE_KEY')}, "
        f"SUPABASE_SERVICE_ROLE_KEY={_env_status('SUPABASE_SERVICE_ROLE_KEY')}, "
        f"SUPABASE_ANON_KEY={_env_status('SUPABASE_ANON_KEY')}, "
        f"OPENROUTER_API_KEY={_env_status('OPENROUTER_API_KEY')}, "
        f"OPENAI_API_KEY={_env_status('OPENAI_API_KEY')}"
    )

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Missing Supabase credentials. Set GitHub Actions secrets SUPABASE_URL and SUPABASE_KEY "
        "(or pass SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY mapped in the workflow env). "
        "Repo: Settings → Secrets and variables → Actions."
    )
if not OPENROUTER_API_KEY:
    raise ValueError("Missing OPENROUTER_API_KEY environment variable (GitHub Actions secret).")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)


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


def clean_generated_body(body: str, headline: str) -> str:
    text = (body or "").replace("\r\n", "\n").strip()
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


def is_google_news_link(url: str) -> bool:
    try:
        host = (urlparse(url).hostname or "").lower()
        return "news.google.com" in host
    except Exception:
        return False


def start_bot():
    feed = feedparser.parse(RSS_URL)
    print(f"Fetched {len(feed.entries)} entries from RSS.")

    for entry in feed.entries[:8]:
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
                "body": summary or title,
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

        if is_google_news_link(source_link):
            rewritten_content = f"{rewritten_content}\n\nSource: {source_link}"

        slug = slugify(rewritten_title)

        data = {
            "title": rewritten_title,
            "content": rewritten_content,
            "image_url": image_url or "",
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
        except Exception as err:
            print(f"Supabase insert error for '{rewritten_title}': {err}")

if __name__ == "__main__":
    start_bot()