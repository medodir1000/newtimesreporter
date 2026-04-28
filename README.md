# newtimesreporter

## Admin dashboard

- Open `http://localhost:3000/admin`
- Login with admin email/password
- Manage article create/update/delete with SEO + hashtags

## Required environment variables

```env
NEXT_PUBLIC_SITE_URL=https://newtimesreporter.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_EMAIL=admin@newtimesreporter.com
ADMIN_PASSWORD=Admin2026@@
ADMIN_SESSION_SECRET=generate_a_long_random_secret
SUPABASE_STORAGE_BUCKET=article-images
# Optional: override Google Tag Manager container (default GTM-5HH4FVFQ). Set to empty to disable.
# NEXT_PUBLIC_GTM_ID=GTM-5HH4FVFQ
```

## Supabase SQL

Run `supabase/articles_admin.sql` and `supabase/article_comments.sql` in your Supabase SQL editor.

Also create a public storage bucket named `article-images` (or set `SUPABASE_STORAGE_BUCKET` to your bucket name).

## SEO (Google Search)

After deploy, open [Google Search Console](https://search.google.com/search-console) → add your property → **Sitemaps** → submit `https://YOUR-DOMAIN/sitemap.xml` (same origin as `NEXT_PUBLIC_SITE_URL`). The app also serves `/robots.txt` with a link to that sitemap (`getSitemapUrl()` / default `https://newtimesreporter.com/sitemap.xml`).

### Google Indexing API + sitemap ping (`bot.py`)

When the bot successfully upserts an article, it calls `google_indexer.notify_new_article()`:

1. **Indexing API** — `URL_UPDATED` for the new article URL (requires a **service account JSON** with the Indexing API enabled, and that account added as an **Owner** on the Search Console property).
2. **Sitemap ping** — GET `https://www.google.com/ping?sitemap=…` and `https://www.bing.com/ping?sitemap=…`.

Set one of:

- `GOOGLE_INDEXING_SA_JSON` — path to the service account JSON file, or  
- `GOOGLE_APPLICATION_CREDENTIALS` — same (standard Google env).

If unset, indexing is skipped (logged). Install Python deps: `pip install -r requirements.txt` (`google-auth`, `google-auth-httplib2`, `httplib2`).

Use `NEXT_PUBLIC_SITE_URL` (or `OPENROUTER_SITE_URL`) so article URLs and sitemap pings match production (e.g. `https://newtimesreporter.com`).

## Netlify

In **Site configuration → Environment variables**, set the **same** Supabase values as locally, for **Production** (and **Preview** if you use branch deploys):

- `NEXT_PUBLIC_SUPABASE_URL` — project URL (`https://….supabase.co`, no trailing slash).
- `SUPABASE_SERVICE_ROLE_KEY` **or** `NEXT_PUBLIC_SUPABASE_ANON_KEY` — server uses the service role if present (recommended), otherwise the anon key (RLS must allow `select` on `articles`).
- `NEXT_PUBLIC_SITE_URL` — your live site URL (e.g. `https://newtimesreporter.com`) for share links and JSON-LD.

If posts exist in Supabase but the live site shows none, the deploy almost always uses a **missing key**, a **different Supabase project**, or keys copied with **extra spaces** (trimmed in code). Trigger a new deploy after saving env vars.
