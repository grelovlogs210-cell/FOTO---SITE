create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  hero_title text,
  hero_subtitle text,
  hero_description text,
  hero_image text
);

create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  image_url text not null,
  is_published boolean not null default false
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null
);

create table if not exists public.about (
  id uuid primary key default gen_random_uuid(),
  content text,
  image_url text
);

alter table public.site_settings enable row level security;
alter table public.portfolio enable row level security;
alter table public.services enable row level security;
alter table public.about enable row level security;

drop policy if exists "Public read site_settings" on public.site_settings;
create policy "Public read site_settings"
on public.site_settings
for select
using (true);

drop policy if exists "Authenticated write site_settings" on public.site_settings;
create policy "Authenticated write site_settings"
on public.site_settings
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public read portfolio" on public.portfolio;
create policy "Public read portfolio"
on public.portfolio
for select
using (true);

drop policy if exists "Authenticated write portfolio" on public.portfolio;
create policy "Authenticated write portfolio"
on public.portfolio
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public read services" on public.services;
create policy "Public read services"
on public.services
for select
using (true);

drop policy if exists "Authenticated write services" on public.services;
create policy "Authenticated write services"
on public.services
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public read about" on public.about;
create policy "Public read about"
on public.about
for select
using (true);

drop policy if exists "Authenticated write about" on public.about;
create policy "Authenticated write about"
on public.about
for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

drop policy if exists "Public read site-assets" on storage.objects;
create policy "Public read site-assets"
on storage.objects
for select
using (bucket_id = 'site-assets');

drop policy if exists "Authenticated write site-assets" on storage.objects;
create policy "Authenticated write site-assets"
on storage.objects
for all
to authenticated
using (bucket_id = 'site-assets')
with check (bucket_id = 'site-assets');
