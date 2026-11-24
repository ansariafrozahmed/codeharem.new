-- ============================================================
-- Project canvas: cards (notes, requirements) placed on an
-- infinite board, plus the last zoom/position per project.
-- Run in Supabase → SQL Editor after 0003.
-- ============================================================

-- Remember where you left the canvas (x, y, zoom)
alter table public.projects add column if not exists canvas_viewport jsonb;

create table if not exists public.project_nodes (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  type        text not null,
  x           double precision not null default 0,
  y           double precision not null default 0,
  width       double precision,
  height      double precision,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint project_nodes_type_valid check (type in ('note', 'requirement')),
  constraint project_nodes_data_size check (pg_column_size(data) <= 20000)
);

create index if not exists project_nodes_project_idx on public.project_nodes (project_id);

drop trigger if exists project_nodes_set_updated_at on public.project_nodes;
create trigger project_nodes_set_updated_at
  before update on public.project_nodes
  for each row execute function public.set_updated_at();

-- ============================================================
-- Security: only the project's owner can see or change its cards.
-- ============================================================
create or replace function public.owns_project(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid and p.owner_id = (select auth.uid())
  );
$$;

alter table public.project_nodes enable row level security;

drop policy if exists "Owners can view project nodes" on public.project_nodes;
create policy "Owners can view project nodes"
  on public.project_nodes for select to authenticated
  using (public.owns_project(project_id));

drop policy if exists "Owners can add project nodes" on public.project_nodes;
create policy "Owners can add project nodes"
  on public.project_nodes for insert to authenticated
  with check (public.owns_project(project_id));

drop policy if exists "Owners can update project nodes" on public.project_nodes;
create policy "Owners can update project nodes"
  on public.project_nodes for update to authenticated
  using (public.owns_project(project_id))
  with check (public.owns_project(project_id));

drop policy if exists "Owners can delete project nodes" on public.project_nodes;
create policy "Owners can delete project nodes"
  on public.project_nodes for delete to authenticated
  using (public.owns_project(project_id));

grant select, insert, update, delete on public.project_nodes to authenticated;
