import os
import re
from urllib.parse import urlparse

import feedparser
from openai import OpenAI
from supabase import create_client

RSS_URL = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY environment variables.")
if not OPENAI_API_KEY:
    raise ValueError("Missing OPENAI_API_KEY environment variable.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client = OpenAI(api_key=OPENAI_API_KEY)


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


def rewrite_article(title: str, summary: str) -> tuple[str, str]:
    prompt = f"""
You are a newsroom editor. Rewrite the following input into:
1) A professional headline.
2) A concise 2-4 paragraph news article in clear journalistic English.

Return as:
Headline: <headline>
Body:
<article body>

Input headline: {title}
Input summary: {summary}
""".strip()

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4
    )
    text = response.choices[0].message.content or ""

    if "Body:" in text and "Headline:" in text:
        headline_part, body_part = text.split("Body:", 1)
        rewritten_title = headline_part.replace("Headline:", "").strip() or title
        rewritten_body = body_part.strip() or summary or title
        return rewritten_title, rewritten_body

    return title, text.strip() or summary or title


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
        image_url = extract_image_url(entry)  # Keep None if no image. Do not skip.

        try:
            rewritten_title, rewritten_content = rewrite_article(title, summary)
        except Exception as err:
            print(f"OpenAI error for '{title}': {err}")
            rewritten_title = title
            rewritten_content = summary or title

        if is_google_news_link(source_link):
            rewritten_content = f"{rewritten_content}\n\nSource: {source_link}"

        slug = slugify(rewritten_title)

        data = {
            "title": rewritten_title,
            "content": rewritten_content,
            "image_url": image_url,
            "slug": slug,
            "category": "World"
        }

        print(f"Attempting to insert: {rewritten_title}")
        try:
            supabase.table("articles").insert(data).execute()
            print(f"Published: {rewritten_title}")
        except Exception as err:
            print(f"Supabase insert error for '{rewritten_title}': {err}")

if __name__ == "__main__":
    start_bot()