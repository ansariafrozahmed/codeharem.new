-- ============================================================
-- 1. "reference" cards (images + links). Old "image" cards are
--    converted to references by the app when they're next saved.
-- 2. save_canvas(): one request saves a whole batch of canvas
--    changes in a single transaction (instead of one per drag).
-- Run in Supabase → SQL Editor after 0006.
-- ============================================================

alter table public.project_nodes drop constraint if exists project_nodes_type_valid;
alter table public.project_nodes
  add constraint project_nodes_type_valid check (type in ('note', 'requirement', 'list', 'image', 'reference'));

create or replace function public.save_canvas(
  p_project_id    uuid,
  p_nodes         jsonb  default '[]'::jsonb,
  p_deleted_nodes uuid[] default '{}',
  p_edges         jsonb  default '[]'::jsonb,
  p_deleted_edges uuid[] default '{}',
  p_viewport      jsonb  default null
)
returns void
language plpgsql
security invoker            -- runs as the caller, so row-level security still applies
set search_path = ''
as $$
begin
  if not public.owns_project(p_project_id) then
    raise exception 'You can''t change this project.' using errcode = '42501';
  end if;

  if coalesce(array_length(p_deleted_edges, 1), 0) > 0 then
    delete from public.project_edges where project_id = p_project_id and id = any (p_deleted_edges);
  end if;

  if coalesce(array_length(p_deleted_nodes, 1), 0) > 0 then
    delete from public.project_nodes where project_id = p_project_id and id = any (p_deleted_nodes);
  end if;

  insert into public.project_nodes (id, project_id, type, x, y, width, height, data)
  select
    (n ->> 'id')::uuid,
    p_project_id,
    n ->> 'type',
    (n ->> 'x')::double precision,
    (n ->> 'y')::double precision,
    nullif(n ->> 'width', '')::double precision,
    nullif(n ->> 'height', '')::double precision,
    coalesce(n -> 'data', '{}'::jsonb)
  from jsonb_array_elements(p_nodes) as n
  on conflict (id) do update
    set type = excluded.type,
        x = excluded.x,
        y = excluded.y,
        width = excluded.width,
        height = excluded.height,
        data = excluded.data
    where public.project_nodes.project_id = p_project_id;

  insert into public.project_edges (id, project_id, source, target, source_handle, target_handle)
  select
    (e ->> 'id')::uuid,
    p_project_id,
    (e ->> 'source')::uuid,
    (e ->> 'target')::uuid,
    e ->> 'source_handle',
    e ->> 'target_handle'
  from jsonb_array_elements(p_edges) as e
  on conflict (id) do nothing;

  if p_viewport is not null then
    update public.projects set canvas_viewport = p_viewport where id = p_project_id;
  elsif jsonb_array_length(p_nodes) > 0 or coalesce(array_length(p_deleted_nodes, 1), 0) > 0
     or jsonb_array_length(p_edges) > 0 or coalesce(array_length(p_deleted_edges, 1), 0) > 0 then
    -- bump "Updated …" on the projects list when the board changes
    update public.projects set updated_at = now() where id = p_project_id;
  end if;
end;
$$;

revoke all on function public.save_canvas(uuid, jsonb, uuid[], jsonb, uuid[], jsonb) from public, anon;
grant execute on function public.save_canvas(uuid, jsonb, uuid[], jsonb, uuid[], jsonb) to authenticated;
