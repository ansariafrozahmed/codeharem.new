-- ============================================================
-- Local-first sync: a version number per canvas so a save made
-- from an older copy (another tab / device) can't silently
-- overwrite newer changes. Run in Supabase → SQL Editor after 0009.
-- ============================================================

alter table public.projects add column if not exists canvas_version integer not null default 0;

-- Replace the old save_canvas (different arguments)
drop function if exists public.save_canvas(uuid, jsonb, uuid[], jsonb, uuid[], jsonb);

-- Returns the canvas version after saving.
-- p_base_version = the version your changes are based on; null = save anyway ("keep mine").
-- If someone saved in between, raises CANVAS_CONFLICT (detail = current version).
create or replace function public.save_canvas(
  p_project_id    uuid,
  p_base_version  integer,
  p_nodes         jsonb  default '[]'::jsonb,
  p_deleted_nodes uuid[] default '{}',
  p_edges         jsonb  default '[]'::jsonb,
  p_deleted_edges uuid[] default '{}',
  p_viewport      jsonb  default null
)
returns integer
language plpgsql
security invoker            -- runs as the caller, so row-level security still applies
set search_path = ''
as $$
declare
  v_current integer;
  v_changed boolean;
begin
  if not public.owns_project(p_project_id) then
    raise exception 'You can''t change this project.' using errcode = '42501';
  end if;

  -- lock the project row so two saves can't interleave
  select canvas_version into v_current from public.projects where id = p_project_id for update;

  v_changed := jsonb_array_length(p_nodes) > 0
            or coalesce(array_length(p_deleted_nodes, 1), 0) > 0
            or jsonb_array_length(p_edges) > 0
            or coalesce(array_length(p_deleted_edges, 1), 0) > 0;

  if v_changed and p_base_version is not null and p_base_version <> v_current then
    raise exception 'CANVAS_CONFLICT' using errcode = 'P0001', detail = v_current::text;
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

  if v_changed then
    update public.projects
      set canvas_version = v_current + 1,
          canvas_viewport = coalesce(p_viewport, canvas_viewport)
      where id = p_project_id;
    return v_current + 1;
  end if;

  if p_viewport is not null then
    update public.projects set canvas_viewport = p_viewport where id = p_project_id;
  end if;
  return v_current;
end;
$$;

revoke all on function public.save_canvas(uuid, integer, jsonb, uuid[], jsonb, uuid[], jsonb) from public, anon;
grant execute on function public.save_canvas(uuid, integer, jsonb, uuid[], jsonb, uuid[], jsonb) to authenticated;
