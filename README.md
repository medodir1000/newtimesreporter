# newtimesreporter
# newtimesreporter

## Admin dashboard

- Open `http://localhost:3000/admin`
- Login with admin email/password
- Manage article create/update/delete with SEO + hashtags

## Required environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_EMAIL=admin@newtimesreporter.com
ADMIN_PASSWORD=Admin2026@
ADMIN_SESSION_SECRET=generate_a_long_random_secret
SUPABASE_STORAGE_BUCKET=article-images
```

## Supabase SQL

Run `supabase/articles_admin.sql` in your Supabase SQL editor.

Also create a public storage bucket named `article-images` (or set `SUPABASE_STORAGE_BUCKET` to your bucket name).
