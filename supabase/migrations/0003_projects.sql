-- ============================================================
-- Projects: one row per client project, owned by one user.
-- Run in Supabase → SQL Editor after 0001 and 0002.
-- ============================================================

create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name         text not null,
  slug         text not null,
  client_name  text,
  description  text,
  status       text not null default 'planning',
  due_date     date,
  website_url  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint projects_name_length check (char_length(name) between 1 and 80),
  constraint projects_slug_format check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$'),
  constraint projects_status_valid check (status in ('planning', 'in_progress', 'review', 'completed', 'on_hold')),
  constraint projects_client_length check (client_name is null or char_length(client_name) <= 80),
  constraint projects_description_length check (description is null or char_length(description) <= 2000),
  -- Slugs are unique per user: /profile/<you>/projects/<slug>
  constraint projects_owner_slug_unique unique (owner_id, slug)
);

create index if not exists projects_owner_updated_idx on public.projects (owner_id, updated_at desc);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ============================================================
-- Security: you can only see and change your own projects.
-- ============================================================
alter table public.projects enable row level security;

drop policy if exists "Owners can view their projects" on public.projects;
create policy "Owners can view their projects"
  on public.projects for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Owners can create projects" on public.projects;
create policy "Owners can create projects"
  on public.projects for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can update their projects" on public.projects;
create policy "Owners can update their projects"
  on public.projects for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can delete their projects" on public.projects;
create policy "Owners can delete their projects"
  on public.projects for delete to authenticated
  using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.projects to authenticated;
