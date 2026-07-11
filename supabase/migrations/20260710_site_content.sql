-- ============================================================================
-- Site Content — client-editable copy for the marketing pages
-- Run in the Supabase SQL editor (or psql against a self-hosted instance).
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1) Admins allow-list. Being AUTHENTICATED is no longer enough to write
--    content — the user must be enrolled here. (Server actions also verify
--    auth via requireAdmin(); this RLS layer protects the direct REST API.)
create table if not exists admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null unique,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- SECURITY DEFINER so policies can consult the admins table without RLS
-- recursion (a policy on admins that selects from admins would loop).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

drop policy if exists "admins read admins" on admins;
create policy "admins read admins" on admins
  for select using (public.is_admin());

-- ── ENROLL THE CLIENT (run once, replace the email) ─────────────────────────
-- insert into admins (user_id, email)
--   select id, email from auth.users where email = 'client@example.com'
--   on conflict (user_id) do nothing;

-- 2) The content table itself. `value` is jsonb holding a JSON string for
--    text/richtext fields and a public URL / path string for image fields.
create table if not exists site_content (
  key        text primary key,
  value      jsonb not null,
  page       text not null,
  label      text not null,
  type       text not null check (type in ('text', 'richtext', 'image')),
  updated_at timestamptz not null default now()
);

create index if not exists site_content_page_idx on site_content (page);

alter table site_content enable row level security;

drop policy if exists "public read site content" on site_content;
create policy "public read site content" on site_content
  for select using (true);

drop policy if exists "admins insert site content" on site_content;
create policy "admins insert site content" on site_content
  for insert with check (public.is_admin());

drop policy if exists "admins update site content" on site_content;
create policy "admins update site content" on site_content
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete site content" on site_content;
create policy "admins delete site content" on site_content
  for delete using (public.is_admin());

-- 3) Keep updated_at honest.
create or replace function public.site_content_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists site_content_touch on site_content;
create trigger site_content_touch
  before update on site_content
  for each row execute function public.site_content_touch();
