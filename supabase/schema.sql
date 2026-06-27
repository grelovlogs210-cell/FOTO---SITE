create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  hero_title text,
  hero_subtitle text,
  hero_description text,
  hero_image text
);

create table if not exists public.about (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  content text,
  image_url text
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text not null,
  description text not null
);

create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text not null,
  category text not null,
  image_url text not null,
  is_published boolean not null default true
);

alter table public.site_settings add column if not exists user_id uuid;
alter table public.about add column if not exists user_id uuid;
alter table public.services add column if not exists user_id uuid;
alter table public.portfolio add column if not exists user_id uuid;

do $$
declare
  target_user_id uuid;
begin
  select id
  into target_user_id
  from auth.users
  where email = 'SEU_EMAIL@gmail.com'
  limit 1;

  if target_user_id is not null then
    update public.site_settings
    set user_id = target_user_id
    where user_id is null;

    update public.about
    set user_id = target_user_id
    where user_id is null;

    update public.services
    set user_id = target_user_id
    where user_id is null;

    update public.portfolio
    set user_id = target_user_id
    where user_id is null;
  end if;
end $$;

alter table public.site_settings alter column user_id set not null;
alter table public.about alter column user_id set not null;
alter table public.services alter column user_id set not null;
alter table public.portfolio alter column user_id set not null;

create unique index if not exists site_settings_user_id_key on public.site_settings (user_id);
create unique index if not exists about_user_id_key on public.about (user_id);
create index if not exists services_user_id_idx on public.services (user_id);
create index if not exists portfolio_user_id_idx on public.portfolio (user_id);

alter table public.site_settings enable row level security;
alter table public.about enable row level security;
alter table public.services enable row level security;
alter table public.portfolio enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;
grant select, insert, update, delete on public.about to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.portfolio to authenticated;

drop policy if exists "user own data site_settings" on public.site_settings;
create policy "user own data site_settings"
on public.site_settings
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user own data about" on public.about;
create policy "user own data about"
on public.about
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user own data services" on public.services;
create policy "user own data services"
on public.services
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user own data portfolio" on public.portfolio;
create policy "user own data portfolio"
on public.portfolio
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

drop policy if exists "user own data site-assets read" on storage.objects;
create policy "user own data site-assets read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'site-assets'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "user own data site-assets write" on storage.objects;
create policy "user own data site-assets write"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'site-assets'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'site-assets'
  and split_part(name, '/', 1) = auth.uid()::text
);
