-- CDSE blog schema. Run in the Supabase SQL editor (or `supabase db push`).

-- Only people listed here may create/edit posts or generate audio.
-- Add yourself after signing up:  insert into public.editors (user_id) values ('<your auth.users id>');
create table if not exists public.editors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.editors enable row level security;
-- (no policies: only the service role / SQL editor can change this table)

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.editors where user_id = auth.uid());
$$;
revoke all on function public.is_editor() from public, anon;
grant execute on function public.is_editor() to authenticated;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  author text not null,
  summary text,
  -- Plain text. Blank line = new paragraph; a line starting "## " = heading.
  -- Null for archive posts that still live on nlujcdse.in (see external_url).
  body text,
  external_url text,
  has_body boolean generated always as (body is not null and length(btrim(body)) > 0) stored,
  audio_url text,
  audio_duration_seconds integer,
  audio_status text not null default 'none' check (audio_status in ('none', 'queued', 'ready', 'failed')),
  audio_error text,
  published boolean not null default false,
  published_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (has_body or external_url is not null)
);
create index if not exists posts_listing_idx on public.posts (published, published_at desc nulls last, sort_order);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at before update on public.posts
  for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;

drop policy if exists "public reads published posts" on public.posts;
create policy "public reads published posts" on public.posts
  for select to anon, authenticated using (published);

drop policy if exists "editors read all posts" on public.posts;
create policy "editors read all posts" on public.posts
  for select to authenticated using (public.is_editor());

drop policy if exists "editors insert posts" on public.posts;
create policy "editors insert posts" on public.posts
  for insert to authenticated with check (public.is_editor());

drop policy if exists "editors update posts" on public.posts;
create policy "editors update posts" on public.posts
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists "editors delete posts" on public.posts;
create policy "editors delete posts" on public.posts
  for delete to authenticated using (public.is_editor());
