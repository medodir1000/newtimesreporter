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
```

## Supabase SQL

Run `supabase/articles_admin.sql` and `supabase/article_comments.sql` in your Supabase SQL editor.

Also create a public storage bucket named `article-images` (or set `SUPABASE_STORAGE_BUCKET` to your bucket name).

## Netlify

In **Site configuration → Environment variables**, set the **same** Supabase values as locally, for **Production** (and **Preview** if you use branch deploys):

- `NEXT_PUBLIC_SUPABASE_URL` — project URL (`https://….supabase.co`, no trailing slash).
- `SUPABASE_SERVICE_ROLE_KEY` **or** `NEXT_PUBLIC_SUPABASE_ANON_KEY` — server uses the service role if present (recommended), otherwise the anon key (RLS must allow `select` on `articles`).
- `NEXT_PUBLIC_SITE_URL` — your live site URL (e.g. `https://newtimesreporter.com`) for share links and JSON-LD.

If posts exist in Supabase but the live site shows none, the deploy almost always uses a **missing key**, a **different Supabase project**, or keys copied with **extra spaces** (trimmed in code). Trigger a new deploy after saving env vars.
