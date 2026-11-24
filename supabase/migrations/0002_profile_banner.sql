-- Banner (cover) image for profiles. Run in Supabase → SQL Editor after 0001.
alter table public.profiles add column if not exists banner_url text;

-- Let users update their own banner too (same row-level policy as before)
grant update (banner_url) on public.profiles to authenticated;
