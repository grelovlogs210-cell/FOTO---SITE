create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  hero_title text,
  hero_subtitle text,
  hero_description text,
  hero_image text
);

create table if not exists public.about (
  id uuid primary key default gen_random_uuid(),
  content text,
  image_url text
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null
);

create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  image_url text not null,
  is_published boolean not null default true
);

alter table public.site_settings enable row level security;
alter table public.about enable row level security;
alter table public.services enable row level security;
alter table public.portfolio enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select on public.about to anon, authenticated;
grant select on public.services to anon, authenticated;
grant select on public.portfolio to anon, authenticated;

drop policy if exists "Public read site_settings" on public.site_settings;
create policy "Public read site_settings"
on public.site_settings
for select
using (true);

drop policy if exists "Public read about" on public.about;
create policy "Public read about"
on public.about
for select
using (true);

drop policy if exists "Public read services" on public.services;
create policy "Public read services"
on public.services
for select
using (true);

drop policy if exists "Public read portfolio" on public.portfolio;
create policy "Public read portfolio"
on public.portfolio
for select
using (true);

drop policy if exists "Authenticated write site_settings" on public.site_settings;
create policy "Authenticated write site_settings"
on public.site_settings
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated write about" on public.about;
create policy "Authenticated write about"
on public.about
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated write services" on public.services;
create policy "Authenticated write services"
on public.services
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated write portfolio" on public.portfolio;
create policy "Authenticated write portfolio"
on public.portfolio
for all
to authenticated
using (true)
with check (true);

insert into public.site_settings (
  id,
  hero_title,
  hero_subtitle,
  hero_description,
  hero_image
)
values (
  '11111111-1111-1111-1111-111111111111',
  'Emilly Alves',
  'Fotografa | Filmmaker | Diretora Criativa',
  'Historias contadas em imagem e movimento com direcao visual, sensibilidade editorial e estetica cinematografica para marcas e projetos criativos.',
  null
)
on conflict (id) do update
set
  hero_title = excluded.hero_title,
  hero_subtitle = excluded.hero_subtitle,
  hero_description = excluded.hero_description,
  hero_image = excluded.hero_image;

insert into public.about (
  id,
  content,
  image_url
)
values (
  '22222222-2222-2222-2222-222222222222',
  'Sou Emilly Alves, fotografa, filmmaker e diretora criativa apaixonada por traduzir emocao em linguagem visual. Ha mais de oito anos crio narrativas que cruzam fotografia, cinema e direcao de arte.

Meu trabalho nasce da escuta, entendendo a essencia de cada projeto antes de criar. Cada peca e construida com cuidado, do conceito a entrega final, para que o resultado seja autentico, visualmente marcante e atemporal.',
  null
)
on conflict (id) do update
set
  content = excluded.content,
  image_url = excluded.image_url;

insert into public.services (
  id,
  title,
  description
)
values
  (
    '33333333-3333-3333-3333-333333333331',
    'Fotografia',
    'Ensaios autorais, editoriais, campanhas publicitarias e coberturas com olhar cinematografico e direcao de arte integrada.'
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    'Producao Audiovisual',
    'Filmes e videos com narrativa cinematografica, roteiro, captacao, direcao e pos-producao para projetos criativos e comerciais.'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Filmes Institucionais',
    'Videos corporativos e institucionais com linguagem visual refinada, da concepcao narrativa a entrega final.'
  ),
  (
    '33333333-3333-3333-3333-333333333334',
    'Conteudo para Marcas',
    'Campanhas publicitarias, conteudo para redes sociais e filmes de marca com direcao criativa e identidade visual forte.'
  ),
  (
    '33333333-3333-3333-3333-333333333335',
    'Direcao Criativa',
    'Concepcao visual, moodboards, direcao de arte e consultoria criativa para campanhas, producoes e marcas.'
  ),
  (
    '33333333-3333-3333-3333-333333333336',
    'Editorial & Comercial',
    'Projetos editoriais e campanhas comerciais que unem storytelling, estetica e estrategia de comunicacao visual.'
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description;

insert into public.portfolio (
  id,
  title,
  category,
  image_url,
  is_published
)
values
  (
    '44444444-4444-4444-4444-444444444441',
    'Serie Luz',
    'Fotografia',
    '',
    true
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    'Editorial Ambar',
    'Direcao Criativa',
    '',
    true
  ),
  (
    '44444444-4444-4444-4444-444444444443',
    'Narrativa',
    'Video',
    '',
    true
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Campos Dourados',
    'Fotografia',
    '',
    true
  ),
  (
    '44444444-4444-4444-4444-444444444445',
    'Colecao Terra',
    'Direcao Criativa',
    '',
    true
  ),
  (
    '44444444-4444-4444-4444-444444444446',
    'Eclipse',
    'Video',
    '',
    true
  )
on conflict (id) do update
set
  title = excluded.title,
  category = excluded.category,
  image_url = excluded.image_url,
  is_published = excluded.is_published;

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
