-- Which side of each card a link attaches to (top / right / bottom / left).
-- 0005 was updated to include these after some databases already ran it,
-- so add them here for those. Safe to run more than once.
alter table public.project_edges add column if not exists source_handle text;
alter table public.project_edges add column if not exists target_handle text;
