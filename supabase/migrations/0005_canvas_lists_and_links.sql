-- ============================================================
-- Canvas: "list" cards (title + checklist) and links between them.
-- Run in Supabase → SQL Editor after 0004.
-- ============================================================

-- Allow the new card type
alter table public.project_nodes drop constraint if exists project_nodes_type_valid;
alter table public.project_nodes
  add constraint project_nodes_type_valid check (type in ('note', 'requirement', 'list'));

-- Links between cards (only lists are linked; the app enforces that)
create table if not exists public.project_edges (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  source      uuid not null references public.project_nodes (id) on delete cascade,
  target      uuid not null references public.project_nodes (id) on delete cascade,
  -- which side of each card the line attaches to (top / right / bottom / left)
  source_handle text,
  target_handle text,
  created_at  timestamptz not null default now(),

  constraint project_edges_not_self check (source <> target),
  constraint project_edges_unique unique (source, target)
);

create index if not exists project_edges_project_idx on public.project_edges (project_id);

alter table public.project_edges enable row level security;

drop policy if exists "Owners can view project edges" on public.project_edges;
create policy "Owners can view project edges"
  on public.project_edges for select to authenticated
  using (public.owns_project(project_id));

drop policy if exists "Owners can add project edges" on public.project_edges;
create policy "Owners can add project edges"
  on public.project_edges for insert to authenticated
  with check (public.owns_project(project_id));

drop policy if exists "Owners can delete project edges" on public.project_edges;
create policy "Owners can delete project edges"
  on public.project_edges for delete to authenticated
  using (public.owns_project(project_id));

grant select, insert, delete on public.project_edges to authenticated;
