create extension if not exists pgcrypto;

create table if not exists public.articles (
  id bigserial primary key,
  slug text not null unique,
  category text default 'News',
  title text not null,
  author text default 'New Time Reporter',
  published_at timestamptz default now(),
  image_url text,
  content text,
  hashtags text[] default '{}'::text[],
  seo_title text,
  seo_description text,
  seo_keywords text[] default '{}'::text[],
  canonical_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_articles_updated_at on public.articles;
create trigger trg_articles_updated_at
before update on public.articles
for each row
execute function public.set_updated_at();

create index if not exists idx_articles_slug on public.articles(slug);
create index if not exists idx_articles_published_at on public.articles(published_at desc);
create index if not exists idx_articles_hashtags_gin on public.articles using gin (hashtags);

alter table public.articles enable row level security;

drop policy if exists "Public can read published articles" on public.articles;
create policy "Public can read published articles"
on public.articles
for select
to anon, authenticated
using (true);

drop policy if exists "Service role full access on articles" on public.articles;
create policy "Service role full access on articles"
on public.articles
for all
to service_role
using (true)
with check (true);
