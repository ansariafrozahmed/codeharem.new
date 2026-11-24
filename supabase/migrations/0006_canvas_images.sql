-- Image cards on the project canvas. Run in Supabase → SQL Editor after 0005.
alter table public.project_nodes drop constraint if exists project_nodes_type_valid;
alter table public.project_nodes
  add constraint project_nodes_type_valid check (type in ('note', 'requirement', 'list', 'image'));
