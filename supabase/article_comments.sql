-- Run in Supabase SQL Editor (after articles table exists).
-- Stores public comments per article slug; inserts go through your Next API (service role).

create table if not exists public.article_comments (
  id uuid primary key default gen_random_uuid(),
  article_slug text not null references public.articles (slug) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint article_comments_author_name_len check (char_length(trim(author_name)) between 1 and 120),
  constraint article_comments_body_len check (char_length(trim(body)) between 1 and 2000)
);

create index if not exists idx_article_comments_slug on public.article_comments (article_slug);
create index if not exists idx_article_comments_created_at on public.article_comments (created_at desc);

alter table public.article_comments enable row level security;

-- Public read (e.g. anon REST or future client reads).
drop policy if exists "Public can read article comments" on public.article_comments;
create policy "Public can read article comments"
on public.article_comments
for select
to anon, authenticated
using (true);

-- No public INSERT: only service_role (Next.js API) writes rows.
drop policy if exists "Service role full access on article comments" on public.article_comments;
create policy "Service role full access on article comments"
on public.article_comments
for all
to service_role
using (true)
with check (true);
